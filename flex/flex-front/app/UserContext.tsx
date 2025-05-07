'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type User = {
  username: string
  email: string
  password?: string // Csak regisztráció során szükséges
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      fetch('http://localhost:8000/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Invalid user')
          return res.json()
        })
        .then((data) => {
          setUser({ username: data.username, email: data.email })
        })
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
    } else {
      setUser(null)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return <UserContext.Provider value={{ user, setUser, logout }}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}
