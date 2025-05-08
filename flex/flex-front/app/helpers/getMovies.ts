'use server'
import MediaItem from '@/types/MediaItem'
import apiClient from '@/app/lib/axiosInstance'
import { cookies } from 'next/headers'

export async function getMovies(): Promise<MediaItem[]> {
  // Token ellenőrzése - több különböző néven is megpróbáljuk megtalálni
  const cookieStore = await cookies()

  // Ellenőrizzük több lehetséges cookie néven (authToken és token)
  let token = cookieStore.get('authToken')?.value || cookieStore.get('token')?.value

  console.log(
    '[getMovies] Available cookies:',
    cookieStore.getAll().map((c) => c.name)
  )
  console.log('[getMovies] Token found:', token ? 'Yes' : 'No')

  // Ha nincs token, üres tömböt adunk vissza
  if (!token) {
    console.log('[getMovies] No token found, returning empty array')
    return []
  }

  try {
    // Explicit beállítjuk a token-t a kérés fejlécében is a withCredentials mellett
    const response = await apiClient.get('/api/filmek', {
      headers: {
        Authorization: `Bearer ${token}`,
        // Alternatív módszer: a cookie manuális beállítása
        Cookie: `authToken=${token}; token=${token}`
      }
    })

    // Debug logok
    console.log('[getMovies] Response status:', response.status)
    console.log('[getMovies] Response data keys:', Object.keys(response.data || {}))
    console.log('[getMovies] Response has movies?', response.data && 'movies' in response.data)

    // Ha van movies tömb, azt adjuk vissza, különben üres tömb
    return response.data?.movies || []
  } catch (error: any) {
    if (error.response) {
      console.log(`[getMovies] Error response status: ${error.response.status}`)
      console.log('[getMovies] Error response data:', error.response.data)

      if (error.response.status === 401) {
        console.log('[getMovies] Authentication error with token:', token.substring(0, 10) + '...')
      }
    } else {
      console.error('[getMovies] Network error:', error.message || error)
    }

    // Minden hibaeset után üres tömböt adunk vissza
    return []
  }
}
