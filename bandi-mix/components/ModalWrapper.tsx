import React, { useEffect, useRef } from 'react';

interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ open, onClose, children }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Modal open/close logic
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  // Escape closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <dialog ref={dialogRef} className="modal" open={open}>
      {children}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default ModalWrapper;
