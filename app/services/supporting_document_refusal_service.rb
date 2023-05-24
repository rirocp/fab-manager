# frozen_string_literal: true

# Provides methods for SupportingDocumentRefusal
class SupportingDocumentRefusalService
  def self.list(filters = {})
    refusals = []
    if filters[:supportable_id].present?
      refusals = SupportingDocumentRefusal.where(supportable_id: filters[:supportable_id],
                                                 supportable_type: filters[:supportable_type])
    end
    refusals
  end

  def self.create(supporting_document_refusal)
    saved = supporting_document_refusal.save

    if saved && supporting_document_refusal.supportable_type == 'User'
      NotificationCenter.call type: 'notify_admin_user_supporting_document_refusal',
                              receiver: User.admins_and_managers,
                              attached_object: supporting_document_refusal
      NotificationCenter.call type: 'notify_user_supporting_document_refusal',
                              receiver: supporting_document_refusal.supportable,
                              attached_object: supporting_document_refusal
    end
    saved
  end
end
