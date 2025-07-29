'use client';

import { useState } from 'react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

interface AuthContainerProps {
  onSuccess?: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthContainer({ onSuccess, defaultMode = 'login' }: AuthContainerProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {mode === 'login' ? (
          <LoginForm
            onSuccess={onSuccess}
            onSwitchToRegister={switchToRegister}
          />
        ) : (
          <RegisterForm
            onSuccess={onSuccess}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </div>
    </div>
  );
} 