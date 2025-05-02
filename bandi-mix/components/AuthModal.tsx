'use client';
import React from 'react';
import ModalWrapper from './ModalWrapper';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  tab: 'login' | 'register';
  setTab: (tab: 'login' | 'register') => void;
  onLoginSuccess?: (user: { name: string; avatar?: string }) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, tab, setTab, onLoginSuccess }) => {
  // Force remount form on open/tab change
  const [formKey, setFormKey] = React.useState(0);
  React.useEffect(() => {
    if (open) setFormKey((k) => k + 1);
  }, [open, tab]);

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="modal-box w-full max-w-md">
        <div className="tabs tabs-boxed mb-4 flex justify-center">
          <a
            className={`tab ${tab === 'login' ? 'tab-active' : ''}`}
            onClick={() => setTab('login')}
          >
            Belépés
          </a>
          <a
            className={`tab ${tab === 'register' ? 'tab-active' : ''}`}
            onClick={() => setTab('register')}
          >
            Regisztráció
          </a>
        </div>
        {tab === 'login' ? (
          <LoginForm key={formKey} onSuccess={onClose} />
        ) : (
          <RegisterForm key={formKey} onSuccess={onClose} />
        )}
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-sm">Bezárás</button>
          </form>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default AuthModal;
