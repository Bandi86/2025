'use client'
import { createContext, useContext, useState } from 'react'
import { User } from '@/types/user'

interface UserContextType {
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  error: string | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
}

export const UserContext = createContext<UserContextType | undefined>(undefined)
export const useUser = () => useContext(UserContext)
export const useUserValue = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUserValue must be used within a UserProvider')
  return context.user
}
export function UserProvider({
  user: initialUser,
  children
}: {
  user: User | null
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <UserContext.Provider value={{ user, setUser, loading, setLoading, error, setError }}>
      {children}
    </UserContext.Provider>
  )
}
