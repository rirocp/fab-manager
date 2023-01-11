# frozen_string_literal: true

require_relative 'cart_item'

# A relation table between a pending event reservation and a special price for this event
class CartItem::EventReservationTicket < ApplicationRecord
  belongs_to :cart_item_event_reservation, class_name: 'CartItem::EventReservation', inverse_of: :cart_item_event_reservation_tickets
  belongs_to :event_price_category, inverse_of: :cart_item_event_reservation_tickets
end
