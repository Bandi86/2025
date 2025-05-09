'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import apiClient from '@/app/lib/axiosInstance' // Importáljuk az apiClient-t
import axios from 'axios' // Az axios import továbbra is szükséges lehet, ha pl. az isAxiosError-t használjuk

export type User = {
  username: string
  email: string
  password?: string // Csak regisztráció során szükséges
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void // Ezt közvetlenül nem használjuk kívülről, de a típus miatt maradhat
  login: (credentials: Pick<User, 'username' | 'password'>) => Promise<void>
  logout: () => Promise<void>
  scannedDirsCount: number // Új state a szkennelt mappák számához
  fetchScannedDirsCount: () => Promise<void> // Függvény a mappák számának frissítésére
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // Betöltési állapot a kezdeti ellenőrzéshez
  const [scannedDirsCount, setScannedDirsCount] = useState<number>(0) // Új state inicializálása

  // Függvény a szkennelt könyvtárak számának lekérésére
  const fetchScannedDirsCount = async () => {
    try {
      const response = await apiClient.get('/api/dirs')
      if (response.data && Array.isArray(response.data.dirs)) {
        setScannedDirsCount(response.data.dirs.length)
      } else {
        setScannedDirsCount(0)
      }
    } catch (error) {
      console.error('Hiba a szkennelt mappák számának lekérésekor:', error)
      setScannedDirsCount(0) // Hiba esetén 0-ra állítjuk
    }
  }

  // Axios válasz interceptor beállítása a globális 401-es hibakezeléshez
  useEffect(() => {
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response, // Sikeres válasz esetén nem csinálunk semmit
      async (error) => {
        if (error.response && error.response.status === 401) {
          // Ha a hiba 401 (Unauthorized), és a hiba nem a logout vagy a /me végpontról jött
          // (hogy elkerüljük a végtelen ciklust, ha a logout vagy a /me maga 401-et adna vissza)
          if (error.config.url !== '/api/user/logout' && error.config.url !== '/api/user/me') {
            console.warn('Globális 401-es hiba észlelve (kivéve logout/me), kijelentkeztetés...')
            try {
              // Megpróbáljuk meghívni a logout funkciót, ami törli a cookie-t a backendről
              // és nullázza a user state-et.
              // A logout() már tartalmaz setUser(null)-t.
              await logout() // Helyesen hívjuk a logout-ot a kontextusból
            } catch (logoutError) {
              console.error('Hiba a globális 401 utáni kijelentkezés közben:', logoutError)
              // Ha a logout is hibát dob, manuálisan nullázzuk a usert, hogy a UI frissüljön.
              setUser(null)
            }
            // Átirányítás a bejelentkezési oldalra
            // Csak kliens oldalon futtatjuk az átirányítást
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/?login'
            }
          }
        }
        return Promise.reject(error) // Fontos: továbbítjuk a hibát
      }
    )

    // Interceptor eltávolítása a komponens unmount-olásakor
    return () => {
      apiClient.interceptors.response.eject(responseInterceptor)
    }
  }, []) // Az üres dependency array biztosítja, hogy ez csak mount-kor és unmount-kor fusson le

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true)
      try {
        // Próbáljuk meg lekérni a felhasználói adatokat a /api/user/me végpontról
        // Ez a végpont a cookie alapján azonosítja a felhasználót
        const response = await apiClient.get('/api/user/me') // apiClient használata
        if (response.data && response.data.user) {
          setUser(response.data.user)
          await fetchScannedDirsCount() // Felhasználó esetén lekérjük a mappák számát
        } else {
          // Ha nincs user adat a válaszban, de a kérés sikeres volt (nem dobott hibát),
          // akkor is null-ra állítjuk, bár ez a backend logikájától függ.
          setUser(null)
          setScannedDirsCount(0) // Nincs felhasználó, nincs mappa
        }
      } catch (error: any) {
        // Any error during the initial session check is treated as "user not logged in".
        // The application will not log an error for this specific check,
        // as a failure here (e.g., 401) is an expected state for unauthenticated users.
        // Browser's console might still show network errors, which is normal.
        setUser(null)
        setScannedDirsCount(0) // Nincs felhasználó, nincs mappa
      } finally {
        setLoading(false)
      }
    }
    checkUserSession()
  }, [])

  const login = async (credentials: Pick<User, 'username' | 'password'>) => {
    try {
      const response = await apiClient.post('/api/user/login', credentials) // apiClient használata
      if (response.data && response.data.user) {
        setUser(response.data.user)
        await fetchScannedDirsCount() // Sikeres bejelentkezés után lekérjük a mappák számát
        // A token cookie-ként lett beállítva a szerver által
      } else {
        // Kezeljük azt az esetet, ha a válasz nem a várt formátumú
        throw new Error('Sikertelen bejelentkezés: érvénytelen válasz a szerverről.')
      }
    } catch (error: any) {
      console.error('Bejelentkezési hiba:', error.response?.data?.message || error.message)
      setUser(null)
      // Hiba továbbadása, hogy a hívó komponens kezelhesse (pl. hibaüzenet megjelenítése)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.post('/api/user/logout') // apiClient használata
      setUser(null)
      setScannedDirsCount(0) // Kijelentkezéskor nullázzuk a mappák számát
    } catch (error: any) {
      console.error('Kijelentkezési hiba:', error.response?.data?.message || error.message)
      setUser(null) // Biztosítjuk, hogy a user nullázva legyen hiba esetén is
      setScannedDirsCount(0) // Hiba esetén is nullázzuk
      throw error
    }
  }

  return (
    <UserContext.Provider
      value={{ user, setUser, login, logout, scannedDirsCount, fetchScannedDirsCount }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}
