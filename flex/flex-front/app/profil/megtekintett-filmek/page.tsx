'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import MediaItem from '@/types/MediaItem'
import axios from 'axios' // Axios importálása
import { useUser } from '@/app/UserContext' // UserContext importálása

// Megtekintett filmek oldal

const SeenMoviesPage = () => {
  const [seenMovies, setSeenMovies] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useUser() // User adatok lekérése a kontextusból

  useEffect(() => {
    const fetchSeenMovies = async () => {
      setIsLoading(true)
      setError(null)

      if (!user) {
        setError('A megtekintett filmek listázásához bejelentkezés szükséges.')
        setIsLoading(false)
        // Ideális esetben itt a UserContext-ből lehetne egy globálisabb hibaállapotot vagy átirányítást kezelni
        return
      }

      try {
        // Az Authorization header-t nem kell manuálisan hozzáadni
        const res = await axios.get(`http://localhost:8000/api/user/seen`)
        setSeenMovies(res.data)
      } catch (err: any) {
        let errorMessage = 'Hiba történt a megtekintett filmek lekérése közben.'
        if (axios.isAxiosError(err) && err.response) {
          if (err.response.status === 401) {
            errorMessage = 'A munkamenet lejárt vagy érvénytelen. Kérjük, jelentkezzen be újra.'
            // Itt is lehetne a UserContext logout funkcióját hívni és/vagy átirányítani a login oldalra.
          } else {
            errorMessage = err.response.data?.message || errorMessage
          }
        }
        setError(errorMessage)
        setSeenMovies([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSeenMovies()
  }, [user]) // user hozzáadva a dependency array-hez

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-lg loading-spinner text-primary"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="alert alert-error shadow-lg">
          <div>
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
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-bold">Hiba!</h3>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 animate-fade-in">
      <div className="text-sm breadcrumbs mb-6 animate-slide-up">
        <ul>
          <li>
            <Link href="/" className="opacity-60">
              Főoldal
            </Link>
          </li>
          <li>
            <Link href="/profil" className="opacity-60">
              Profil
            </Link>
          </li>
          <li className="font-medium">Megtekintett Filmek</li>
        </ul>
      </div>

      <h1 className="text-3xl font-bold mb-8 font-poppins">Megtekintett Filmjeim</h1>

      {seenMovies.length === 0 ? (
        <div className="alert alert-info shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-info shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>Nincsenek még megtekintett filmjeid.</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {seenMovies.map((movie, index) => (
            <div
              key={movie.id}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out card-hover animate-entrance"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <figure className="px-4 pt-4">
                <Link href={`/filmek/${movie.id}`}>
                  <img
                    src={movie.omdb?.poster || `https://picsum.photos/seed/${movie.id}/300/450`}
                    alt={movie.title || movie.name}
                    className="rounded-xl h-64 w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </Link>
              </figure>
              <div className="card-body items-center text-center p-4">
                <h2
                  className="card-title text-md font-poppins truncate w-full"
                  title={movie.title || movie.name}
                >
                  <Link
                    href={`/filmek/${movie.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {movie.title || movie.name}
                  </Link>
                </h2>
                {movie.omdb?.year && (
                  <p className="text-xs text-base-content/70">{movie.omdb.year}</p>
                )}
                <div className="card-actions mt-2">
                  <Link href={`/filmek/${movie.id}`} className="btn btn-primary btn-sm">
                    Részletek
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SeenMoviesPage
