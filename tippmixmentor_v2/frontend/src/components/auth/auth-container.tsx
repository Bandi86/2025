'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { useAuth } from '@/hooks/use-auth';

interface AuthContainerProps {
  onSuccess?: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthContainer({ onSuccess, defaultMode = 'login' }: AuthContainerProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleAuthSuccess = () => {
    onSuccess?.();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {mode === 'login' ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={switchToRegister}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </div>
    </div>
  );
} 