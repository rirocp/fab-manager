# frozen_string_literal: true

require 'payment/service'

# Stripe payement gateway
module Stripe; end

## create remote objects on stripe
class Stripe::Service < Payment::Service

  # Build the subscription base on the given shopping cart and create it on the remote stripe API
  def subscribe(payment_method_id, shopping_cart)
    price_details = shopping_cart.total

    payment_schedule = price_details[:schedule][:payment_schedule]
    payment_schedule.payment_schedule_items = price_details[:schedule][:items]
    first_item = price_details[:schedule][:items].min_by(&:due_date)
    subscription = shopping_cart.items.find { |item| item.class == CartItem::Subscription }.to_object
    reservable_stp_id = shopping_cart.items.find { |item| item.is_a?(CartItem::Reservation) }&.to_object
                          &.reservable&.payment_gateway_object&.gateway_object_id

    WalletService.debit_user_wallet(payment_schedule, shopping_cart.customer, transaction: false)
    handle_wallet_transaction(payment_schedule)

    price = create_price(first_item.details['recurring'],
                         subscription.plan.payment_gateway_object.gateway_object_id,
                         nil, monthly: true)
    # other items (not recurring)
    items = subscription_invoice_items(payment_schedule, subscription, first_item, reservable_stp_id)

    create_remote_subscription(shopping_cart, payment_schedule, items, price, payment_method_id, subscription)
  end

  def create_subscription(payment_schedule, stp_object_id, stp_object_type)
    stripe_key = Setting.get('stripe_secret_key')

    stp_subscription = Stripe::Item.new(stp_object_type, stp_object_id).retrieve

    payment_method_id = Stripe::Customer.retrieve(stp_subscription.customer, api_key: stripe_key).invoice_settings.default_payment_method
    payment_method = Stripe::PaymentMethod.retrieve(payment_method_id, api_key: stripe_key)
    pgo = PaymentGatewayObject.new(item: payment_schedule)
    pgo.gateway_object = payment_method
    pgo.save!
  end

  def create_user(user_id)
    StripeWorker.perform_async(:create_stripe_customer, user_id)
  end

  def create_coupon(coupon_id)
    coupon = Coupon.find(coupon_id)
    stp_coupon = { id: coupon.code }
    if coupon.type == 'percent_off'
      stp_coupon[:percent_off] = coupon.percent_off
    elsif coupon.type == stripe_amount('amount_off')
      stp_coupon[:amount_off] = coupon.amount_off
      stp_coupon[:currency] = Setting.get('stripe_currency')
    end

    stp_coupon[:duration] = coupon.validity_per_user == 'always' ? 'forever' : 'once'
    stp_coupon[:redeem_by] = coupon.valid_until.to_i unless coupon.valid_until.nil?
    stp_coupon[:max_redemptions] = coupon.max_usages unless coupon.max_usages.nil?

    Stripe::Coupon.create(stp_coupon, api_key: Setting.get('stripe_secret_key'))
  end

  def delete_coupon(coupon_id)
    coupon = Coupon.find(coupon_id)
    StripeWorker.perform_async(:delete_stripe_coupon, coupon.code)
  end

  def create_or_update_product(klass, id)
    StripeWorker.perform_async(:create_or_update_stp_product, klass, id)
  rescue Stripe::InvalidRequestError => e
    raise ::PaymentGatewayError, e
  end

  def stripe_amount(amount)
    currency = Setting.get('stripe_currency')
    return amount / 100 if zero_decimal_currencies.any? { |s| s.casecmp(currency).zero? }

    amount
  end

  def process_payment_schedule_item(payment_schedule_item)
    stripe_key = Setting.get('stripe_secret_key')
    stp_subscription = payment_schedule_item.payment_schedule.gateway_subscription.retrieve
    stp_invoice = Stripe::Invoice.retrieve(stp_subscription.latest_invoice, api_key: stripe_key)
    if stp_invoice.status == 'paid'
      ##### Successfully paid
      PaymentScheduleService.new.generate_invoice(payment_schedule_item,
                                                  payment_method: 'card',
                                                  payment_id: stp_invoice.payment_intent,
                                                  payment_type: 'Stripe::PaymentIntent')
      payment_schedule_item.update_attributes(state: 'paid', payment_method: 'card')
      pgo = PaymentGatewayObject.find_or_initialize_by(item: payment_schedule_item)
      pgo.gateway_object = stp_invoice
      pgo.save!
    elsif stp_subscription.status == 'past_due' || stp_invoice.status == 'open'
      ##### Payment error
      if payment_schedule_item.state == 'new'
        # notify only for new deadlines, to prevent spamming
        NotificationCenter.call type: 'notify_admin_payment_schedule_failed',
                                receiver: User.admins_and_managers,
                                attached_object: payment_schedule_item
        NotificationCenter.call type: 'notify_member_payment_schedule_failed',
                                receiver: payment_schedule_item.payment_schedule.user,
                                attached_object: payment_schedule_item
      end
      stp_payment_intent = Stripe::PaymentIntent.retrieve(stp_invoice.payment_intent, api_key: stripe_key)
      payment_schedule_item.update_attributes(state: stp_payment_intent.status,
                                              client_secret: stp_payment_intent.client_secret)
      pgo = PaymentGatewayObject.find_or_initialize_by(item: payment_schedule_item)
      pgo.gateway_object = stp_invoice
      pgo.save!
    else
      payment_schedule_item.update_attributes(state: 'error')
    end
  end

  def pay_payment_schedule_item(payment_schedule_item)
    stripe_key = Setting.get('stripe_secret_key')
    stp_invoice = Stripe::Invoice.pay(@payment_schedule_item.payment_gateway_object.gateway_object_id, {}, { api_key: stripe_key })
    PaymentScheduleItemWorker.new.perform(@payment_schedule_item.id)

    { status: stp_invoice.status }
  rescue Stripe::StripeError => e
    stripe_key = Setting.get('stripe_secret_key')
    stp_invoice = Stripe::Invoice.retrieve(@payment_schedule_item.payment_gateway_object.gateway_object_id, api_key: stripe_key)
    PaymentScheduleItemWorker.new.perform(@payment_schedule_item.id)

    { status: stp_invoice.status, error: e }
  end

  def attach_method_as_default(payment_method_id, customer_id)
    stripe_key = Setting.get('stripe_secret_key')

    # attach the payment method to the given customer
    method = Stripe::PaymentMethod.attach(
      payment_method_id,
      { customer: customer_id },
      { api_key: stripe_key }
    )
    # then set it as the default payment method for this customer
    Stripe::Customer.update(
      customer_id,
      { invoice_settings: { default_payment_method: payment_method_id } },
      { api_key: stripe_key }
    )
    method
  end

  private


  # Create the provided PaymentSchedule on Stripe, using the Subscription API
  def create_remote_subscription(shopping_cart, payment_schedule, items, price, payment_method_id, subscription)
    stripe_key = Setting.get('stripe_secret_key')
    if subscription.start_at.nil?
      Stripe::Subscription.create({
                                    customer: shopping_cart.customer.payment_gateway_object.gateway_object_id,
                                    cancel_at: (payment_schedule.payment_schedule_items.max_by(&:due_date).due_date + 1.month).to_i,
                                    add_invoice_items: items,
                                    coupon: payment_schedule.coupon&.code,
                                    items: [
                                      { price: price[:id] }
                                    ],
                                    default_payment_method: payment_method_id,
                                    expand: %w[latest_invoice.payment_intent]
                                  }, { api_key: stripe_key })
    else
      Stripe::SubscriptionSchedule.create({
                                            customer: shopping_cart.customer.payment_gateway_object.gateway_object_id,
                                            start_date: subscription.start_at.to_i,
                                            end_behavior: 'cancel',
                                            phases: [
                                              {
                                                items: [
                                                  { price: price[:id] }
                                                ],
                                                add_invoice_items: items,
                                                coupon: payment_schedule.coupon&.code,
                                                default_payment_method: payment_method_id,
                                                end_date: (
                                                  payment_schedule.payment_schedule_items.max_by(&:due_date).due_date + 1.month
                                                ).to_i
                                              }
                                            ]
                                          }, { api_key: stripe_key })
    end
  end

  def subscription_invoice_items(payment_schedule, subscription, first_item, reservable_stp_id)
    second_item = payment_schedule.payment_schedule_items.sort_by(&:due_date)[1]

    items = []
    if second_item && first_item.amount != second_item.amount
      unless first_item.details['adjustment']&.zero?
        # adjustment: when dividing the price of the plan / months, sometimes it forces us to round the amount per month.
        # The difference is invoiced here
        p1 = create_price(first_item.details['adjustment'],
                          subscription.plan.payment_gateway_object.gateway_object_id,
                          "Price adjustment for payment schedule #{payment_schedule.id}")
        items.push(price: p1[:id])
      end
      unless first_item.details['other_items']&.zero?
        # when taking a subscription at the same time of a reservation (space, machine or training), the amount of the
        # reservation is invoiced here.
        p2 = create_price(first_item.details['other_items'],
                          reservable_stp_id,
                          "Reservations for payment schedule #{payment_schedule.id}")
        items.push(price: p2[:id])
      end
    end

    items
  end

  def create_price(amount, stp_product_id, name, monthly: false)
    params = {
      unit_amount: stripe_amount(amount),
      currency: Setting.get('stripe_currency'),
      product: stp_product_id,
      nickname: name
    }
    params[:recurring] = { interval: 'month', interval_count: 1 } if monthly

    Stripe::Price.create(params, api_key: Setting.get('stripe_secret_key'))
  end

  def handle_wallet_transaction(payment_schedule)
    return unless payment_schedule.wallet_amount

    customer_id = payment_schedule.invoicing_profile.user.payment_gateway_object.gateway_object_id
    Stripe::Customer.update(customer_id, { balance: -payment_schedule.wallet_amount }, { api_key: Setting.get('stripe_secret_key') })
  end

  # @see https://stripe.com/docs/currencies#zero-decimal
  def zero_decimal_currencies
    %w[BIF CLP DJF GNF JPY KMF KRW MGA PYG RWF UGX VND VUV XAF XOF XPF]
  end
end
