import React from 'react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

/**
 * Aurelian Minimalist Confirmation Dialog.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} props.onConfirm
 * @param {string} [props.title='Confirm Action']
 * @param {string} [props.description]
 * @param {string} [props.confirmLabel='Confirm']
 * @param {string} [props.cancelLabel='Cancel']
 * @param {'primary' | 'danger' | 'accent'} [props.confirmVariant='primary']
 * @param {boolean} [props.isLoading=false]
 * @param {React.ReactNode} [props.children]
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  children,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
