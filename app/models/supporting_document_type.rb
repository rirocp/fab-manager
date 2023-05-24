# frozen_string_literal: true

class SupportingDocumentType < ApplicationRecord
  has_many :supporting_document_types_groups, dependent: :destroy
  has_many :groups, through: :supporting_document_types_groups

  has_many :supporting_document_files, dependent: :destroy

  has_many :supporting_document_refusals_types, dependent: :destroy
  has_many :supporting_document_refusals, through: :supporting_document_refusals_types

  validates :document_type, presence: true, inclusion: { in: %w[User Child] }
end
