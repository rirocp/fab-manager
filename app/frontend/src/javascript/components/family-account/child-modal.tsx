import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FabModal, ModalSize } from '../base/fab-modal';
import { Child } from '../../models/child';
import ChildAPI from '../../api/child';
import { ChildForm } from './child-form';
import { SupportingDocumentType } from '../../models/supporting-document-type';
import { ChildValidation } from './child-validation';
import { User } from '../../models/user';

interface ChildModalProps {
  child?: Child;
  operator: User;
  isOpen: boolean;
  toggleModal: () => void;
  onSuccess: (msg: string) => void;
  onError: (error: string) => void;
  supportingDocumentsTypes: Array<SupportingDocumentType>;
}

/**
 * A modal for creating or editing a child.
 */
export const ChildModal: React.FC<ChildModalProps> = ({ child, isOpen, toggleModal, onSuccess, onError, supportingDocumentsTypes, operator }) => {
  const { t } = useTranslation('public');

  /**
   * Save the child to the API
   */
  const handleSaveChild = async (data: Child): Promise<void> => {
    try {
      if (child?.id) {
        await ChildAPI.update(data);
      } else {
        await ChildAPI.create(data);
      }
      toggleModal();
      onSuccess('');
    } catch (error) {
      onError(error);
    }
  };

  return (
    <FabModal title={t(`app.public.child_modal.${child?.id ? 'edit' : 'new'}_child`)}
      width={ModalSize.large}
      isOpen={isOpen}
      toggleModal={toggleModal}
      closeButton={true}
      confirmButton={false} >
      {(operator?.role === 'admin' || operator?.role === 'manager') &&
        <ChildValidation child={child} onSuccess={onSuccess} onError={onError} />
      }
      <ChildForm
        child={child}
        onSubmit={handleSaveChild}
        supportingDocumentsTypes={supportingDocumentsTypes}
        operator={operator}
        onSuccess={onSuccess}
        onError={onError}
      />
    </FabModal>
  );
};
