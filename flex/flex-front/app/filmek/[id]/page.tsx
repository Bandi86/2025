import React from 'react'
import { getMovieItem } from '@/app/helpers/getMovieItem'
import Link from 'next/link'

interface PageProps {
  params: { id: string }
}

const Page = async ({ params }: PageProps) => {
  const { id } = await params
  const item = await getMovieItem(id)
  
  if (!item) {
    return (
      <div className="container mx-auto py-8">
        <div className="alert alert-error shadow-lg">
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
          <div>
            <h3 className="font-bold">Nincs ilyen film!</h3>
            <div className="text-xs">Az azonosító nem található az adatbázisban.</div>
          </div>
          <Link href="/filmek" className="btn btn-sm btn-primary">
            Vissza a filmekhez
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Navigációs útvonal */}
      <div className="text-sm breadcrumbs mb-6 animate-slide-up">
        <ul>
          <li>
            <Link href="/" className="opacity-60">
              Főoldal
            </Link>
          </li>
          <li>
            <Link href="/filmek" className="opacity-60">
              Filmek
            </Link>
          </li>
          <li className="font-medium">{item.title || item.name}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Bal oldali infó rész */}
        <div className="md:col-span-1 animate-entrance" style={{ animationDelay: '0.1s' }}>
          <div className="card bg-base-100 shadow-lg overflow-hidden card-hover">
            <figure className="px-4 pt-4">
              {item.omdb?.poster ? (
                <img
                  src={item.omdb.poster}
                  alt={item.title || item.name}
                  className="rounded-xl w-full shadow-md hover:shadow-xl transition-shadow"
                />
              ) : (
                <img
                  src={`https://picsum.photos/300/450?random=${item.id}`}
                  alt={item.title || item.name}
                  className="rounded-xl w-full shadow-md hover:shadow-xl transition-shadow"
                />
              )}
            </figure>
            <div className="card-body pt-4">
              <h2 className="card-title text-xl font-poppins">{item.title || item.name}</h2>

              {item.omdb && (
                <div className="space-y-3 mt-2">
                  {item.omdb.imdbRating && (
                    <div className="flex items-center gap-1 bg-base-200 p-2 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-6 h-6 text-warning fill-warning"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                      <span className="font-bold text-xl text-warning">{item.omdb.imdbRating}</span>
                      <span className="text-sm text-base-content/70 mt-1">/ 10 IMDb</span>
                    </div>
                  )}

                  {item.omdb.year && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold font-poppins">Év:</span>
                      <span className="badge badge-lg badge-neutral">{item.omdb.year}</span>
                    </div>
                  )}

                  {item.omdb.genre && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold font-poppins">Műfaj:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.omdb.genre.split(',').map((genre, i) => (
                          <span key={i} className="badge badge-primary">
                            {genre.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.omdb.director && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold font-poppins">Rendező:</span>
                      <span className="text-sm">{item.omdb.director}</span>
                    </div>
                  )}

                  {item.omdb.actors && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold font-poppins">Szereplők:</span>
                      <span className="text-sm">{item.omdb.actors}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="divider my-2"></div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold font-poppins">Fájl adatok:</span>
                <div className="text-xs text-base-content/70 space-y-2 bg-base-200 p-3 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center">
                    <span>Kiterjesztés:</span>
                    <span className="badge badge-outline badge-sm">{item.extension}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Méret:</span>
                    <span className="badge badge-outline badge-sm">
                      {item.size ? (item.size / (1024 * 1024)).toFixed(1) : 'N/A'} MB
                    </span>
                  </div>
                  <details className="collapse collapse-arrow bg-base-100 rounded-md shadow-xs">
                    <summary className="collapse-title p-2 min-h-0 text-xs font-medium flex justify-between items-center cursor-pointer">
                      <span>Teljes elérési út</span>
                      {/* Opcionálisan egy kis ikon itt */}
                    </summary>
                    <div className="collapse-content p-2 bg-base-300/30 rounded-b-md">
                      <p className="text-xs break-all font-mono select-all">{item.path}</p>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobb oldali videó és leírás */}
        <div className="md:col-span-2 animate-entrance" style={{ animationDelay: '0.2s' }}>
          <div className="card bg-base-100 shadow-lg card-hover">
            <div className="card-body">
              <h2 className="card-title font-poppins text-xl flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                  />
                </svg>
                Lejátszás
              </h2>
              <div className="rounded-lg overflow-hidden shadow-lg">
                <video
                  className="w-full h-full aspect-video"
                  controls
                  src={`http://localhost:8000/api/stream/${item.id}`}
                  poster={item.omdb?.poster || `https://picsum.photos/600/340?random=${item.id}`}
                >
                  A böngésződ nem támogatja a videó lejátszást.
                </video>
              </div>

              {item.omdb?.plot && (
                <div className="mt-6">
                  <h3 className="font-poppins font-semibold text-lg mb-2 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                      />
                    </svg>
                    Történet
                  </h3>
                  <div className="bg-base-200 p-4 rounded-lg">
                    <p className="text-base-content/90 leading-relaxed">{item.omdb.plot}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ajánlott filmek blokk helye (továbbbfejlesztési lehetőség) */}
        </div>
      </div>
    </div>
  )
}

export default Page
