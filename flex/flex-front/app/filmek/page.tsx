import React from 'react'
import Link from 'next/link'
import { getMovies } from '@/app/helpers/getMovies'

const Page = async () => {
  const movies = await getMovies()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Filmek: {movies.length}</h1>
      {movies.length === 0 ? (
        <div role="alert" className="alert alert-warning mb-8">
          <span>Nincs indexelt tartalom. Kérlek, indítsd el az indexelést a backend oldalon!</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {movies?.map((movie) => (
            <Link key={movie.id} href={`/filmek/${movie.id}`}>
              <div className="card bg-base-100 shadow-md hover:shadow-xl transition cursor-pointer">
                <figure>
                  {movie.coverUrl ? (
                    <img src={movie.coverUrl} alt={movie.name} />
                  ) : (
                    <img
                      src={`https://picsum.photos/600/340?random=${movie.id}`}
                      alt={movie.name}
                    />
                  )}
                </figure>
                <div className="card-body">
                  <h2 className="card-title">{movie.title || movie.name}</h2>
                  {movie.omdb && (
                    <>
                      <p className="text-xs text-gray-500 mb-1">
                        {movie.omdb.year} • {movie.omdb.genre}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">Rendező: {movie.omdb.director}</p>
                      <p className="text-xs text-gray-500 mb-1">Szereplők: {movie.omdb.actors}</p>
                      <p className="text-xs text-gray-500 mb-1 line-clamp-2">{movie.omdb.plot}</p>
                      <p className="text-xs text-yellow-600 font-bold mb-1">
                        IMDb: {movie.omdb.imdbRating}
                      </p>
                    </>
                  )}
                  <p className="text-sm text-base-content/70">
                    {movie.extension} • {(movie.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  <div className="card-actions justify-end">
                    <button className="btn btn-primary btn-sm">Részletek</button>
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
