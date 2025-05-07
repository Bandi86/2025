import React from 'react'
import MediaItem from '@/types/MediaItem'
import MovieCardSmall from './MovieCardSmall'

const MovieCarouselSection: React.FC<{ title: string; movies?: MediaItem[] }> = ({
  title,
  movies
}) => {
  if (!movies || movies.length === 0) return null
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4 font-poppins">{title}</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary scrollbar-track-base-200 snap-x snap-mandatory">
        {movies.map((movie) => (
          <MovieCardSmall key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  )
}

export default MovieCarouselSection
