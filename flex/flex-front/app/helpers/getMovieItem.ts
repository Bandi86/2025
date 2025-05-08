import MediaItem from '@/types/MediaItem'
import axios from 'axios' // Axios importálása

export async function getMovieItem(id: string): Promise<MediaItem | null> {
  try {
    const response = await axios.get('http://localhost:8000/api/filmek')
    // Axios esetén a response.data tartalmazza a JSON választ
    const movies = response.data?.movies
    if (movies && Array.isArray(movies)) {
      const item = movies.find((m: MediaItem) => String(m.id) === id)
      return item || null
    }
    return null // Ha a movies nem létezik vagy nem tömb
  } catch (error) {
    console.error(`Hiba a film (ID: ${id}) lekérésekor (getMovieItem):`, error)
    // Hiba esetén null-t adunk vissza, ahogy az eredeti kód is tette
    return null
  }
}
