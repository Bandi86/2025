'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { getMovies } from '@/app/helpers/getMovies'
import MediaItem from '@/types/MediaItem'

const Page = () => {
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState('title-asc') // Alapértelmezett rendezés

  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true)
      try {
        const fetchedMovies = await getMovies()
        setMovies(fetchedMovies || [])
      } catch (error) {
        console.error('Hiba a filmek betöltésekor:', error)

        setMovies([]) // Hiba esetén üres lista
      } finally {
        setIsLoading(false)
      }
    }
    fetchMovies()
  }, [])

  const sortedMovies = useMemo(() => {
    let tempMovies = [...movies]
    switch (sortOrder) {
      case 'title-asc':
        tempMovies.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name))
        break
      case 'title-desc':
        tempMovies.sort((a, b) => (b.title || b.name).localeCompare(a.title || a.name))
        break
      case 'year-desc': // Újabb elöl
        tempMovies.sort((a, b) => {
          const yearA = parseInt(a.omdb?.year || '0')
          const yearB = parseInt(b.omdb?.year || '0')
          return yearB - yearA
        })
        break
      case 'year-asc': // Régebbi elöl
        tempMovies.sort((a, b) => {
          const yearA = parseInt(a.omdb?.year || '0')
          const yearB = parseInt(b.omdb?.year || '0')
          return yearA - yearB
        })
        break
      case 'rating-desc':
        tempMovies.sort((a, b) => {
          const ratingA = parseFloat(a.omdb?.imdbRating || '0')
          const ratingB = parseFloat(b.omdb?.imdbRating || '0')
          return ratingB - ratingA
        })
        break
      case 'rating-asc':
        tempMovies.sort((a, b) => {
          const ratingA = parseFloat(a.omdb?.imdbRating || '0')
          const ratingB = parseFloat(b.omdb?.imdbRating || '0')
          return ratingA - ratingB
        })
        break
      default:
        break
    }
    return tempMovies
  }, [movies, sortOrder])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-lg loading-spinner text-primary"></span>
      </div>
    )
  }

  return (
    <div className="animate-fade-in container mx-auto px-4 py-8">
      <header className="mb-8 animate-slide-up">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-title">Filmek száma</div>
              <div className="stat-value text-primary">{sortedMovies.length}</div>
              <div className="stat-desc">A médiatárban</div>
            </div>
          </div>

          {/* Szűrő és rendező elemek */}
          {movies.length > 0 && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Rendezés</span>
              </label>
              <select
                className="select select-bordered select-primary w-full sm:w-auto shadow"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="title-asc">Név szerint (A-Z)</option>
                <option value="title-desc">Név szerint (Z-A)</option>
                <option value="year-desc">Kiadási év (Újabb elöl)</option>
                <option value="year-asc">Kiadási év (Régebbi elöl)</option>
                <option value="rating-desc">IMDb értékelés (Csökkenő)</option>
                <option value="rating-asc">IMDb értékelés (Növekvő)</option>
              </select>
            </div>
          )}
        </div>
      </header>

      {sortedMovies.length === 0 ? (
        <div
          role="alert"
          className="alert alert-warning mb-8 max-w-md mx-auto shadow-lg animate-entrance"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Nincs indexelt tartalom</h3>
            <div className="text-xs">
              Kérlek, indítsd el az indexelést a beállítások oldalon, vagy ellenőrizd a szűrési
              feltételeket.
            </div>
          </div>
          <Link href="/beallitasok" className="btn btn-sm btn-primary">
            Beállítások
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {sortedMovies.map((movie, index) => (
            <Link key={movie.id} href={`/filmek/${movie.id}`}>
              <div
                className="card card-compact bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full overflow-hidden group card-hover animate-entrance"
                style={{ animationDelay: `${index * 0.03}s` }} // Finomított animációs késleltetés
              >
                <figure className="h-64 sm:h-72 md:h-80 relative overflow-hidden">
                  {' '}
                  {/* Reszponzív magasság */}
                  {movie.omdb?.poster ? ( // posterUrl-re cserélve
                    <img
                      src={movie.omdb.poster}
                      alt={movie.title || movie.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy" // Kép lusta betöltése
                    />
                  ) : (
                    <div className="w-full h-full bg-base-300 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-16 h-16 text-base-content/30"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
                    {movie.omdb?.imdbRating && (
                      <div className="absolute top-2 right-2 badge badge-warning gap-1 shadow-lg z-10 text-sm p-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="none"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                        <span className="font-bold">{movie.omdb.imdbRating}</span>
                      </div>
                    )}
                    <div className="p-3 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <h2 className="card-title text-base lg:text-lg line-clamp-1 font-poppins mb-1">
                        {movie.title || movie.name}
                      </h2>
                      {movie.omdb?.plot && (
                        <p className="text-xs text-gray-200 line-clamp-2 mb-2">{movie.omdb.plot}</p>
                      )}
                      <button className="btn btn-primary btn-xs sm:btn-sm w-full opacity-90 hover:opacity-100">
                        Részletek
                      </button>
                    </div>
                  </div>
                </figure>
                {/* Kártya törzse a képen kívül, ha a design úgy kívánja, hogy a cím mindig látható legyen */}
                <div className="card-body p-3">
                  <h2 className="card-title text-sm md:text-base line-clamp-1 font-poppins group-hover:hidden">
                    {movie.title || movie.name}
                  </h2>
                  <div className="flex gap-1 items-center flex-wrap mt-1 group-hover:hidden">
                    {movie.omdb?.year && (
                      <span className="badge badge-xs badge-neutral">{movie.omdb.year}</span>
                    )}
                    {movie.omdb?.genre &&
                      movie.omdb.genre
                        .split(',')
                        .slice(0, 1)
                        .map(
                          (
                            genre,
                            i // Csak az első műfaj
                          ) => (
                            <span key={i} className="badge badge-xs badge-primary badge-outline">
                              {genre.trim()}
                            </span>
                          )
                        )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Page
