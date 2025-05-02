import React from 'react';
import { useAuth } from './AuthContext';

const LogoutButton: React.FC = () => {
  const { logout, isLoggedIn } = useAuth();
  return (
    <button
      className="btn btn-secondary btn-wide"
      onClick={logout}
      disabled={!isLoggedIn}
      type="button"
    >
      Kijelentkezés
    </button>
  );
};

export default LogoutButton;
