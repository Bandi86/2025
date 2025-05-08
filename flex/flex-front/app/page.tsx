import HeroSectionComponent from '@/components/home/HeroSection'
import MovieCarouselSection from '@/components/home/MovieCarouselSection'
import { getMovies } from './helpers/getMovies'
import MediaItem from '@/types/MediaItem'
import WelcomeBox from '@/components/home/WelcomeBox'
import { cookies } from 'next/headers'

export default async function Home() {
  let allMovies: MediaItem[] = []
  let heroItem: MediaItem | null = null
  let latestItems: MediaItem[] = []
  let topRatedItems: MediaItem[] = []
  let isUserLoggedIn = false // Alapértelmezetten nincs bejelentkezve
  let moviesError: string | null = null // Hibák tárolására

  // Ellenőrizzük, hogy van-e authToken cookie (be van-e jelentkezve)
  const cookieStore = await cookies()
  const token = cookieStore.get('authToken')?.value

  // Ha nincs token, ne kérjük le a filmeket, csak jelenítsük meg a WelcomeBox-ot
  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <WelcomeBox />
      </div>
    )
  }

  try {
    // Csak akkor kérjük le a filmeket, ha van token
    allMovies = await getMovies()
    isUserLoggedIn = true // Ha a getMovies sikeres, a felhasználó be van jelentkezve
  } catch (error: any) {
    if (error.message === 'Unauthorized: 401' || error.message === 'ContentNotFoundForUser: 404') {
      isUserLoggedIn = false
    } else {
      console.error('Hiba a főoldalon a filmek lekérésekor:', error)
      moviesError = 'Hiba történt a filmek betöltése közben. Kérjük, próbálja újra később.'
      isUserLoggedIn = true
    }
  }

  if (isUserLoggedIn && allMovies.length > 0) {
    heroItem =
      allMovies
        .filter((item) => item.modifiedAt)
        .sort((a, b) => new Date(b.modifiedAt!).getTime() - new Date(a.modifiedAt!).getTime())[0] ||
      allMovies[0]

    latestItems = allMovies
      .filter((item) => item.type === 'film' && item.modifiedAt)
      .sort((a, b) => new Date(b.modifiedAt!).valueOf() - new Date(a.modifiedAt!).valueOf())
      .slice(0, 10)

    topRatedItems = allMovies
      .filter(
        (item) => item.type === 'film' && item.omdb?.imdbRating && item.omdb.imdbRating !== 'N/A'
      )
      .sort((a, b) => parseFloat(b.omdb!.imdbRating) - parseFloat(a.omdb!.imdbRating))
      .slice(0, 10)
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      {!isUserLoggedIn ? (
        <WelcomeBox />
      ) : moviesError ? (
        <div className="text-center py-10">
          <p className="text-xl text-red-500">{moviesError}</p>
        </div>
      ) : (
        <>
          {heroItem && <HeroSectionComponent movie={heroItem} />}
          <MovieCarouselSection title="Legújabb filmek" movies={latestItems} />
          <MovieCarouselSection title="Legjobbra értékelt filmek" movies={topRatedItems} />
          {allMovies.length === 0 && isUserLoggedIn && (
            <div className="text-center py-10">
              <p className="text-xl text-gray-500">Jelenleg nincsenek filmek az adatbázisban.</p>
              <p className="text-md text-gray-400">
                Kérlek, szkennelj be néhány könyvtárat a beállításoknál.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
