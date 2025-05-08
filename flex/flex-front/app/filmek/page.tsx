import { getMovies } from '@/app/helpers/getMovies'
import MediaItem from '@/types/MediaItem'
import { redirect } from 'next/navigation'
import FilmekListazo from '@/components/filmek/FilmekListazo'
import ErrorDisplay from '@/components/common/ErrorDisplay'

export default async function FilmekPage() {
  let movies: MediaItem[] = []

  try {
    movies = await getMovies()
    console.log(movies)

  } catch (error: any) {
    if (error.message === 'Unauthorized: 401') {
      redirect(
        '/auth?login&message=Kérjük, jelentkezzen be a tartalom megtekintéséhez.&redirectTo=/filmek'
      )
    } else if (error.message === 'ContentNotFoundForUser: 404') {
      console.log(
        'ContentNotFoundForUser: 404 caught in FilmekPage, proceeding with empty movie list.'
      )
      // movies marad üres tömb, FilmekListazo kezeli
    } else {
      // Egyéb, nem várt hibák esetén
      console.error('UNEXPECTED ERROR in FilmekPage - getMovies failed:', error) // Részletesebb logolás
      console.log('RENDERING ErrorDisplay component due to unexpected error.') // Új log üzenet
      return (
        <ErrorDisplay
          title="Hiba a filmek betöltésekor"
          message="Váratlan hiba történt a filmek lekérése közben. Kérjük, próbálja meg később újra, vagy lépjen kapcsolatba az oldal üzemeltetőjével."
          linkHref="/"
          linkText="Vissza a főoldalra"
        />
      )
    }
  }

  // Itt már biztosan van `movies` tömb (lehet üres), és a felhasználó be van jelentkezve.
  // A FilmekListazo komponens kezeli, ha a movies tömb üres.
  return <FilmekListazo initialMovies={movies} />
}
