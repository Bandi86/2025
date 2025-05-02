'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  isPaid?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function decodeJwt(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      username: payload.username || payload.email,
      email: payload.email,
      avatar: payload.avatar,
      isAdmin: payload.isAdmin,
      isPaid: payload.isPaid,
    };
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Betöltés localStorage-ből oldalbetöltéskor
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      setToken(stored);
      setUser(decodeJwt(stored));
    }
    setLoading(false);
  }, []);

  // Token változásra user frissítése
  useEffect(() => {
    if (token) {
      setUser(decodeJwt(token));
      localStorage.setItem('token', token);
    } else {
      setUser(null);
      localStorage.removeItem('token');
    }
  }, [token]);

  // Másik tabon történt login/logout figyelése
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.token) {
        setToken(res.data.token);
        return { success: true };
      }
      return { success: false, error: 'Hibás válasz a szervertől.' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Ismeretlen hiba.' };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/register', { username, email, password });
      if (res.data.token) {
        setToken(res.data.token);
        return { success: true };
      }
      return { success: false, error: 'Hibás válasz a szervertől.' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Ismeretlen hiba.' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    axios.post('/api/auth/logout').catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoggedIn: !!user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
