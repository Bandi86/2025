import React from 'react';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

const LogoutButton: React.FC = () => {
  const { logout, isLoggedIn } = useAuth();
  const router = useRouter();
  const handleLogout = () => {
    logout();
    router.push('/');
  };
  return (
    <button
      className="btn btn-secondary btn-wide"
      onClick={handleLogout}
      disabled={!isLoggedIn}
      type="button"
    >
      Kijelentkezés
    </button>
  );
};

export default LogoutButton;
