import React from 'react'
import Link from 'next/link'
import MediaItem from '@/types/MediaItem'

const HeroSection: React.FC<{ movie?: MediaItem; continueItem?: MediaItem }> = ({
  movie,
  continueItem
}) => {
  // Ha van continueItem, azt jelenítjük meg kiemelten
  const hero = continueItem || movie
  if (!hero) {
    return (
      <div className="hero min-h-[50vh] bg-base-200 rounded-lg shadow-xl mb-12 animate-fade-in">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold text-base-content/70">Üdv a Flex Média Szerveren!</h1>
            <p className="py-6 text-base-content/60">
              Fedezd fel filmjeidet és sorozataidat. Adj hozzá új mappákat a beállításoknál a
              kezdéshez.
            </p>
            <Link href="/beallitasok" className="btn btn-primary">
              Beállítások
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const linkHref = hero.type === 'film' ? `/filmek/${hero.id}` : `/sorozatok/${hero.id}`
  return (
    <section
      className="hero min-h-[60vh] bg-base-200 rounded-lg shadow-xl mb-12 animate-fade-in"
      style={{
        backgroundImage: hero.omdb?.poster ? `url(${hero.omdb.poster})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div
        className={`hero-overlay rounded-lg ${
          hero.omdb?.poster ? 'bg-opacity-70' : 'bg-opacity-0'
        }`}
      ></div>
      <div className="hero-content text-center text-neutral-content">
        <div className="max-w-md">
          {continueItem && (
            <div className="mb-2">
              <span className="badge badge-primary badge-lg text-xs">Folytasd a megtekintést</span>
            </div>
          )}
          <h1 className="mb-5 text-4xl md:text-5xl font-bold font-poppins line-clamp-2 drop-shadow-lg">
            {hero.title ?? hero.name}
          </h1>
          {hero.omdb?.plot && (
            <p className="mb-5 text-sm md:text-base line-clamp-3 drop-shadow-md">
              {hero.omdb.plot}
            </p>
          )}
          <Link href={linkHref} className="btn btn-primary shadow-lg">
            Részletek
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 ml-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
