import React, { FormEvent, useEffect, useState } from 'react';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import { GatewayFormProps } from '../abstract-payment-modal';
import LocalPaymentAPI from '../../../api/local-payment';
import FormatLib from '../../../lib/format';
import SettingAPI from '../../../api/setting';
import { SettingName } from '../../../models/setting';
import { PaymentModal } from '../payment-modal';
import { PaymentSchedule } from '../../../models/payment-schedule';
import { PaymentMethod } from '../../../models/payment';

const ALL_SCHEDULE_METHODS = ['card', 'check'] as const;
type scheduleMethod = typeof ALL_SCHEDULE_METHODS[number];

/**
 * Option format, expected by react-select
 * @see https://github.com/JedWatson/react-select
 */
type selectOption = { value: scheduleMethod, label: string };

/**
 * A form component to ask for confirmation before cashing a payment directly at the FabLab's reception.
 * This is intended for use by privileged users.
 * The form validation button must be created elsewhere, using the attribute form={formId}.
 */
export const LocalPaymentForm: React.FC<GatewayFormProps> = ({ onSubmit, onSuccess, onError, children, className, paymentSchedule, cart, updateCart, customer, operator, formId }) => {
  const { t } = useTranslation('admin');

  const [method, setMethod] = useState<scheduleMethod>('check');
  const [onlinePaymentModal, setOnlinePaymentModal] = useState<boolean>(false);

  useEffect(() => {
    if (cart.payment_method === PaymentMethod.Card) {
      setMethod('card');
    } else {
      setMethod('check');
    }
  }, [cart]);

  /**
   * Open/closes the online payment modal, used to collect card credentials when paying the payment schedule by card.
   */
  const toggleOnlinePaymentModal = (): void => {
    setOnlinePaymentModal(!onlinePaymentModal);
  };

  /**
   * Convert all payement methods for schedules to the react-select format
   */
  const buildMethodOptions = (): Array<selectOption> => {
    return ALL_SCHEDULE_METHODS.map(i => methodToOption(i));
  };

  /**
   * Convert the given payment-method to the react-select format
   */
  const methodToOption = (value: scheduleMethod): selectOption => {
    if (!value) return { value, label: '' };

    return { value, label: t(`app.admin.local_payment.method_${value}`) };
  };

  /**
   * Callback triggered when the user selects a payment method for the current payment schedule.
   */
  const handleUpdateMethod = (option: selectOption) => {
    if (option.value === 'card') {
      updateCart(Object.assign({}, cart, { payment_method: PaymentMethod.Card }));
    } else {
      updateCart(Object.assign({}, cart, { payment_method: PaymentMethod.Other }));
    }
    setMethod(option.value);
  };

  /**
   * Handle the submission of the form. It will process the local payment.
   */
  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    onSubmit();

    if (paymentSchedule && method === 'card') {
      // check that the online payment is active
      try {
        const online = await SettingAPI.get(SettingName.OnlinePaymentModule);
        if (online.value !== 'true') {
          return onError(t('app.admin.local_payment.online_payment_disabled'));
        }
        return toggleOnlinePaymentModal();
      } catch (e) {
        onError(e);
      }
    }

    try {
      const document = await LocalPaymentAPI.confirmPayment(cart);
      onSuccess(document);
    } catch (e) {
      onError(e);
    }
  };

  /**
   * Callback triggered after a successful payment by online card for a schedule.
   */
  const afterCreatePaymentSchedule = (document: PaymentSchedule) => {
    toggleOnlinePaymentModal();
    onSuccess(document);
  };

  /**
   * Generally, this form component is only shown to admins or to managers when they book for someone else.
   * If this is not the case, then it is shown to validate a free (or prepaid by wallet) cart.
   * This function will return `true` in the later case.
   */
  const isFreeOfCharge = (): boolean => {
    return (customer.id === operator.id);
  };

  /**
   * Get the type of the main item in the cart compile
   */
  const mainItemType = (): string => {
    return Object.keys(cart.items[0])[0];
  };

  return (
    <form onSubmit={handleSubmit} id={formId} className={className || ''}>
      {!paymentSchedule && !isFreeOfCharge() && <p className="payment">{t('app.admin.local_payment.about_to_cash')}</p>}
      {!paymentSchedule && isFreeOfCharge() && <p className="payment">{t('app.admin.local_payment.about_to_confirm', { ITEM: mainItemType() })}</p>}
      {paymentSchedule && <div className="payment-schedule">
        <div className="schedule-method">
          <label htmlFor="payment-method">{t('app.admin.local_payment.payment_method')}</label>
          <Select placeholder={ t('app.admin.local_payment.payment_method') }
            id="payment-method"
            className="method-select"
            onChange={handleUpdateMethod}
            options={buildMethodOptions()}
            value={methodToOption(method)} />
          {method === 'card' && <p>{t('app.admin.local_payment.card_collection_info')}</p>}
          {method === 'check' && <p>{t('app.admin.local_payment.check_collection_info', { DEADLINES: paymentSchedule.items.length })}</p>}
        </div>
        <div className="full-schedule">
          <ul>
            {paymentSchedule.items.map(item => {
              return (
                <li key={`${item.due_date}`}>
                  <span className="schedule-item-date">{FormatLib.date(item.due_date)}</span>
                  <span> </span>
                  <span className="schedule-item-price">{FormatLib.price(item.amount)}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <PaymentModal isOpen={onlinePaymentModal}
          toggleModal={toggleOnlinePaymentModal}
          afterSuccess={afterCreatePaymentSchedule}
          onError={onError}
          cart={cart}
          currentUser={operator}
          customer={customer}
          schedule={paymentSchedule} />
      </div>}
      {children}
    </form>
  );
};
