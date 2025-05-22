'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'
import { User } from '@/types/user'

/**
 * Ez a komponens inicializálja a felhasználói állapotot a szerver oldali renderelés során
 * átadott adatokkal. A beépített UserProvider helyett használható.
 */
export default function UserInitializer({ user }: { user: User }) {
  const { setUser } = useUserStore()

  // SSR során kapott felhasználó adatok beállítása a Zustand store-ba
  useEffect(() => {
    if (user) {
      setUser(user)
    }
  }, [user, setUser])

  // Ez a komponens nem renderel semmit, csak inicializálja a store-t
  return null
}
