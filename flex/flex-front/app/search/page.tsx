import React from 'react'
import { getMovies } from '@/app/helpers/getMovies'
import Link from 'next/link'

export default async function SearchPage({
  searchParams
}: {
  searchParams: { q: string }
}) {
  const searchQuery = searchParams.q || ''
  const movies = await getMovies()

  // Kereső logika
  const filteredMovies = movies.filter(movie => {
    const title = movie.title || movie.name || ''
    const plot = movie.omdb?.plot || ''
    const actors = movie.omdb?.actors || ''
    const director = movie.omdb?.director || ''

    return (
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      director.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Keresési eredmények: "{searchQuery}"
      </h1>

      {filteredMovies.length === 0 ? (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>Nincs találat a keresésre.</span>
        </div>
      ) : (
        <>
          <p className="mb-4">{filteredMovies.length} találat</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <Link key={movie.id} href={`/filmek/${movie.id}`}>
                <div className="card card-compact bg-base-100 shadow-md hover:shadow-xl transition cursor-pointer h-full">
                  <figure className="h-48 relative">
                    {movie.omdb?.poster ? (
                      <img
                        src={movie.omdb.poster}
                        alt={movie.title || movie.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={`https://picsum.photos/300/400?random=${movie.id}`}
                        alt={movie.title || movie.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {movie.omdb?.imdbRating && (
                      <div className="absolute top-2 right-2 badge badge-warning gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 fill-current">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                        {movie.omdb.imdbRating}
                      </div>
                    )}
                  </figure>
                  <div className="card-body">
                    <h2 className="card-title text-base line-clamp-1">{movie.title || movie.name}</h2>
                    {movie.omdb && (
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <span className="badge badge-sm">{movie.omdb.year}</span>
                          <span className="text-xs line-clamp-1">{movie.omdb.genre}</span>
                        </div>
                        <p className="text-xs text-base-content/70 line-clamp-2">{movie.omdb.plot}</p>
                      </div>
                    )}
                    <div className="card-actions justify-end mt-auto">
                      <button className="btn btn-primary btn-sm">Részletek</button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
