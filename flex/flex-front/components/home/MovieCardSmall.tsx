import React from 'react'
import Link from 'next/link'
import MediaItem from '@/types/MediaItem'

const MovieCardSmall: React.FC<{ movie: MediaItem }> = ({ movie }) => {
  const { id, type, title, name, omdb } = movie
  const { poster, year, imdbRating } = omdb || { poster: '', year: '', imdbRating: '' }

  const linkHref = type === 'film' ? `/filmek/${id}` : `/sorozatok/${id}`
  return (
    <Link
      href={linkHref}
      className="card card-compact bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-300 w-48 md:w-56 flex-shrink-0 snap-start card-hover group"
    >
      <figure className="h-64 md:h-72 relative overflow-hidden">
        {poster ? (
          <img
            src={poster}
            alt={title || name || 'Media poster'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-base-300 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-base-content/30"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        )}
      </figure>
      <div className="card-body p-3">
        <h2 className="card-title text-sm md:text-base line-clamp-1 font-poppins">
          {title || name}
        </h2>
        <div className="flex justify-between items-center text-xs text-base-content/70 mt-1">
          <span>{year || 'N/A'}</span>
          {imdbRating && imdbRating !== 'N/A' && (
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3 h-3 text-warning"
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{imdbRating}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default MovieCardSmall
