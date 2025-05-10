import React from 'react';

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => (
  <div className="alert alert-error mb-4">
    <span>{message}</span>
    <button onClick={onClose} className="btn btn-xs ml-2">
      Bezárás
    </button>
  </div>
);

export default ErrorAlert;
