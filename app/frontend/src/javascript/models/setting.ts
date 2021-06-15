import { HistoryValue } from './history-value';

export enum SettingName {
  AboutTitle = 'about_title',
  AboutBody = 'about_body',
  AboutContacts = 'about_contacts',
  PrivacyDraft = 'privacy_draft',
  PrivacyBody = 'privacy_body',
  PrivacyDpo = 'privacy_dpo',
  TwitterName = 'twitter_name',
  HomeBlogpost = 'home_blogpost',
  MachineExplicationsAlert = 'machine_explications_alert',
  TrainingExplicationsAlert = 'training_explications_alert',
  TrainingInformationMessage = 'training_information_message',
  SubscriptionExplicationsAlert = 'subscription_explications_alert',
  InvoiceLogo = 'invoice_logo',
  InvoiceReference = 'invoice_reference',
  InvoiceCodeActive = 'invoice_code-active',
  InvoiceCodeValue = 'invoice_code-value',
  InvoiceOrderNb = 'invoice_order-nb',
  InvoiceVATActive = 'invoice_VAT-active',
  InvoiceVATRate = 'invoice_VAT-rate',
  InvoiceText = 'invoice_text',
  InvoiceLegals = 'invoice_legals',
  BookingWindowStart = 'booking_window_start',
  BookingWindowEnd = 'booking_window_end',
  BookingMoveEnable = 'booking_move_enable',
  BookingMoveDelay = 'booking_move_delay',
  BookingCancelEnable = 'booking_cancel_enable',
  BookingCancelDelay = 'booking_cancel_delay',
  MainColor = 'main_color',
  SecondaryColor = 'secondary_color',
  FablabName = 'fablab_name',
  NameGenre = 'name_genre',
  ReminderEnable = 'reminder_enable',
  ReminderDelay = 'reminder_delay',
  EventExplicationsAlert = 'event_explications_alert',
  SpaceExplicationsAlert = 'space_explications_alert',
  VisibilityYearly = 'visibility_yearly',
  VisibilityOthers = 'visibility_others',
  DisplayNameEnable = 'display_name_enable',
  MachinesSortBy = 'machines_sort_by',
  AccountingJournalCode = 'accounting_journal_code',
  AccountingCardClientCode = 'accounting_card_client_code',
  AccountingCardClientLabel = 'accounting_card_client_label',
  AccountingWalletClientCode = 'accounting_wallet_client_code',
  AccountingWalletClientLabel = 'accounting_wallet_client_label',
  AccountingOtherClientCode = 'accounting_other_client_code',
  AccountingOtherClientLabel = 'accounting_other_client_label',
  AccountingWalletCode = 'accounting_wallet_code',
  AccountingWalletLabel = 'accounting_wallet_label',
  AccountingVATCode = 'accounting_VAT_code',
  AccountingVATLabel = 'accounting_VAT_label',
  AccountingSubscriptionCode = 'accounting_subscription_code',
  AccountingSubscriptionLabel = 'accounting_subscription_label',
  AccountingMachineCode = 'accounting_Machine_code',
  AccountingMachineLabel = 'accounting_Machine_label',
  AccountingTrainingCode = 'accounting_Training_code',
  AccountingTrainingLabel = 'accounting_Training_label',
  AccountingEventCode = 'accounting_Event_code',
  AccountingEventLabel = 'accounting_Event_label',
  AccountingSpaceCode = 'accounting_Space_code',
  AccountingSpaceLabel = 'accounting_Space_label',
  HubLastVersion = 'hub_last_version',
  HubPublicKey = 'hub_public_key',
  FabAnalytics = 'fab_analytics',
  LinkName = 'link_name',
  HomeContent = 'home_content',
  HomeCss = 'home_css',
  Origin = 'origin',
  Uuid = 'uuid',
  PhoneRequired = 'phone_required',
  TrackingId = 'tracking_id',
  BookOverlappingSlots = 'book_overlapping_slots',
  SlotDuration = 'slot_duration',
  EventsInCalendar = 'events_in_calendar',
  SpacesModule = 'spaces_module',
  PlansModule = 'plans_module',
  InvoicingModule = 'invoicing_module',
  FacebookAppId = 'facebook_app_id',
  TwitterAnalytics = 'twitter_analytics',
  RecaptchaSiteKey = 'recaptcha_site_key',
  RecaptchaSecretKey = 'recaptcha_secret_key',
  FeatureTourDisplay = 'feature_tour_display',
  EmailFrom = 'email_from',
  DisqusShortname = 'disqus_shortname',
  AllowedCadExtensions = 'allowed_cad_extensions',
  AllowedCadMimeTypes = 'allowed_cad_mime_types',
  OpenlabAppId = 'openlab_app_id',
  OpenlabAppSecret = 'openlab_app_secret',
  OpenlabDefault = 'openlab_default',
  OnlinePaymentModule = 'online_payment_module',
  StripePublicKey = 'stripe_public_key',
  StripeSecretKey = 'stripe_secret_key',
  StripeCurrency = 'stripe_currency',
  InvoicePrefix = 'invoice_prefix',
  ConfirmationRequired = 'confirmation_required',
  WalletModule = 'wallet_module',
  StatisticsModule = 'statistics_module',
  UpcomingEventsShown = 'upcoming_events_shown',
  PaymentSchedulePrefix = 'payment_schedule_prefix',
  TrainingsModule = 'trainings_module',
  AddressRequired = 'address_required',
  PaymentGateway = 'payment_gateway',
  PayZenUsername = 'payzen_username',
  PayZenPassword = 'payzen_password',
  PayZenEndpoint = 'payzen_endpoint',
  PayZenPublicKey = 'payzen_public_key',
  PayZenHmacKey = 'payzen_hmac',
  PayZenCurrency = 'payzen_currency',
  PublicAgendaModule = 'public_agenda_module'
}

export interface Setting {
  name: SettingName,
  localized?: string,
  value: string,
  last_update?: Date,
  history?: Array<HistoryValue>
}

export interface SettingError {
  error: string,
  id: number,
  name: string
}

export interface SettingBulkResult {
  status: boolean,
  value?: any,
  error?: string,
  localized?: string,
}
