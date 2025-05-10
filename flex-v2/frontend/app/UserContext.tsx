'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  fetchCurrentUser,
  loginUser as apiLoginUser,
  logoutUser as apiLogoutUser,
  fetchScannedDirectories,
} from '@/app/lib/apiFetcher';
import apiClient from '@/app/lib/axiosInstance';

export type User = {
  id: string;
  username: string;
  email: string;
};

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  scannedDirsCount: number;
  fetchScannedDirsCount: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scannedDirsCount, setScannedDirsCount] = useState<number>(0);

  // Szkennelt könyvtárak számának lekérése
  const fetchScannedDirsCount = async () => {
    try {
      const response = await fetchScannedDirectories();
      if (response.dirs && Array.isArray(response.dirs)) {
        setScannedDirsCount(response.dirs.length);
      } else if ('notFound' in response) {
        // 404-es válasz (nincs még szkennelt könyvtár)
        setScannedDirsCount(0);
      } else {
        setScannedDirsCount(0);
      }
    } catch (error) {
      console.error('Hiba a szkennelt mappák számának lekérésekor:', error);
      setScannedDirsCount(0);
    }
  };

  // Axios interceptor a 401-es hibák kezelésére
  useEffect(() => {
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          if (error.config.url !== '/api/user/logout' && error.config.url !== '/api/user/me') {
            console.warn('Globális 401-es hiba észlelve, kijelentkeztetés...');
            try {
              await logout();
            } catch (logoutError) {
              console.error('Hiba a globális 401 utáni kijelentkezés közben:', logoutError);
              setUser(null);
            }

            if (typeof window !== 'undefined') {
              window.location.href = '/auth/?login';
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Felhasználói munkamenet ellenőrzése
  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const response = await fetchCurrentUser();
        if (response.user) {
          setUser(response.user);
          await fetchScannedDirsCount();
        } else {
          setUser(null);
          setScannedDirsCount(0);
        }
      } catch (error) {
        setUser(null);
        setScannedDirsCount(0);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  // Bejelentkezés
  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await apiLoginUser(credentials);
      if (response.user) {
        setUser(response.user);
        await fetchScannedDirsCount();
      } else {
        throw new Error('Sikertelen bejelentkezés: érvénytelen válasz a szerverről.');
      }
    } catch (error: any) {
      console.error('Bejelentkezési hiba:', error.message);
      setUser(null);
      throw error;
    }
  };

  // Kijelentkezés
  const logout = async () => {
    try {
      await apiLogoutUser();
      setUser(null);
      setScannedDirsCount(0);
    } catch (error: any) {
      console.error('Kijelentkezési hiba:', error.message);
      setUser(null);
      setScannedDirsCount(0);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, login, logout, scannedDirsCount, fetchScannedDirsCount }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
