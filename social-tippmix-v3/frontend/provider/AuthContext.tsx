'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types/user'
import * as authProvider from './authProvider'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (name: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUser = async () => {
    setLoading(true)
    try {
      const me = await authProvider.getMe()
      setUser(me)
      setError(null)
    } catch (error) {
      // Ha a hiba azt jelenti, hogy nincs bejelentkezve a user, ne állítsunk be hibát
      if (
        error instanceof Error &&
        (error.message.includes('Unauthorized') || error.message.includes('401'))
      ) {
        setUser(null)
        setError(null)
      } else {
        setUser(null)
        setError(error instanceof Error ? error.message : 'Ismeretlen hiba történt')
        console.error('Hiba a felhasználó lekérdezésekor:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
    const interval = setInterval(refreshUser, 60_000) // 1 percenként
    return () => clearInterval(interval)
  }, [])

  const login = async (name: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const user = await authProvider.login(name, password)
      setUser(user)
      
      // direct to admin page if user is admin
      if (user.role === 'ADMIN') {
        // Redirect to the admin page or any other page
        if (typeof window !== 'undefined') {
          window.location.href = '/admin'
        }
      }
    } catch (error) {
      setError('Sikertelen bejelentkezés')
      throw new Error('Sikertelen bejelentkezés')
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const user = await authProvider.register(name, email, password)
      setUser(user)
    } catch (error) {
      setError('Sikertelen regisztráció')
      throw new Error('Sikertelen regisztráció')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)
    try {
      // Call backend logout endpoint (assume /api/user/logout is proxied or use full URL if needed)
      await fetch('/api/user/logout', { method: 'GET', credentials: 'include' })
      setUser(null)
      // Optionally: reload or redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/auth?mode=login'
      }
    } catch (error) {
      setError('Sikertelen kijelentkezés')
      throw new Error('Sikertelen kijelentkezés')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {/* Hibák megjelenítése, ha van */}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {children}
    </AuthContext.Provider>
  )
}
