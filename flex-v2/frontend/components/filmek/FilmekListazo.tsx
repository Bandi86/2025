'use client';
import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { MediaItem } from '@/types/MediaItems';
import Link from 'next/link';
import { fetchMoviesAdvanced, MovieFilterOptions } from '@/app/lib/apiFetcher';

// Eltávolítjuk az initialMovies prop-ot, helyette SWR-t használunk
const FilmekListazo = () => {
  // Állapot változók a szűréshez, rendezéshez
  const [sortOrder, setSortOrder] = useState('title-asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20); // Oldalankénti filmek száma
  const [isLoading, setIsLoading] = useState(false);

  // Rendezési paraméterek kiszámítása
  const [sortBy, sortDirection] = sortOrder.split('-') as [
    'title' | 'year' | 'rating',
    'asc' | 'desc'
  ];

  // Szűrő állapot
  const [filterOptions, setFilterOptions] = useState<MovieFilterOptions>({
    page: page,
    limit: limit,
    sortBy: sortBy,
    sortOrder: sortDirection,
  });

  // Filterek frissítése, amikor változnak a paraméterek
  useEffect(() => {
    setFilterOptions({
      page,
      limit,
      sortBy,
      sortOrder: sortDirection,
    });
  }, [page, limit, sortBy, sortDirection]);

  // SWR hook a filmek lekérdezésére
  const { data, error, isValidating, mutate } = useSWR(
    // A kulcs változásával újra lekérdezi az adatokat
    ['/movies', JSON.stringify(filterOptions)],
    // Fetcher függvény
    async () => {
      setIsLoading(true);
      try {
        const result = await fetchMoviesAdvanced(filterOptions);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    {
      revalidateOnFocus: false, // Ne frissítsen automatikusan, ha az ablak fókuszba kerül
      dedupingInterval: 5000, // 5 másodperc alatt ne kérdezzen le újra azonos kulcsokkal
    }
  );

  // Filmek és metaadatok kinyerése az API válaszból
  const movies = data?.movies || [];
  const totalMovies = data?.total || 0;
  const totalPages = data?.pages || 1;

  // Lapozás kezelése
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  // Rendezés módosítása
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
    // Lapozás visszaállítása az elejére új rendezésnél
    setPage(1);
  };

  // Újratöltés kezelése
  const handleReload = () => {
    mutate(); // SWR adatok frissítése
  };

  return (
    <div className="animate-fade-in container mx-auto px-4 py-8">
      <header className="mb-8 animate-slide-up">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-title text-primary">Filmek száma: {movies.length}</div>
              <div className="stat-value text-primary">{totalMovies}</div>
              <div className="stat-desc">A médiatárban</div>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Rendezés</span>
              </label>
              <select
                className="select select-bordered select-primary w-full sm:w-auto shadow"
                value={sortOrder}
                onChange={handleSortChange}
                disabled={isLoading}
              >
                <option value="title-asc">Név szerint (A-Z)</option>
                <option value="title-desc">Név szerint (Z-A)</option>
                <option value="year-desc">Kiadási év (Újabb elöl)</option>
                <option value="year-asc">Kiadási év (Régebbi elöl)</option>
                <option value="rating-desc">IMDb értékelés (Csökkenő)</option>
                <option value="rating-asc">IMDb értékelés (Növekvő)</option>
              </select>
            </div>

            <button
              className="btn btn-circle btn-ghost"
              onClick={handleReload}
              disabled={isLoading}
              title="Frissítés"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Betöltési állapot */}
      {isLoading && (
        <div className="flex justify-center my-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {/* Hiba kezelése */}
      {error && !isLoading && (
        <div className="alert alert-error mb-8">
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
          <span>Hiba történt a filmek betöltése közben. Kérjük, próbáld újra később.</span>
          <button className="btn btn-sm" onClick={handleReload}>
            Újra
          </button>
        </div>
      )}

      {/* Üres állapot kezelése */}
      {!isLoading && !error && movies.length === 0 && (
        <div className="alert alert-info mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>Nincsenek találatok a megadott szűrésnek megfelelően.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {movies.map((movie: MediaItem, index: number) => (
          <Link key={movie.id} href={`/filmek/${movie.id}`}>
            <div
              className="card card-compact bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full overflow-hidden group card-hover animate-entrance"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <figure className="h-64 sm:h-72 md:h-80 relative overflow-hidden">
                {movie.omdb?.poster ? (
                  <img
                    src={movie.omdb.poster}
                    alt={movie.title ?? movie.name}
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
                      {movie.title ?? movie.name}
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
              <div className="card-body p-3">
                <h2 className="card-title text-sm md:text-base line-clamp-1 font-poppins group-hover:hidden">
                  {movie.title ?? movie.name}
                </h2>
                <div className="flex gap-1 items-center flex-wrap mt-1 group-hover:hidden">
                  {movie.omdb?.year && (
                    <span className="badge badge-xs badge-neutral">{movie.omdb.year}</span>
                  )}
                  {movie.omdb?.genre &&
                    movie.omdb.genre
                      .split(',')
                      .slice(0, 1)
                      .map((genre: string, i: number) => (
                        <span key={i} className="badge badge-xs badge-primary badge-outline">
                          {genre.trim()}
                        </span>
                      ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Lapozó navigáció */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-4">
          <button
            className="btn btn-primary"
            onClick={handlePrevPage}
            disabled={page === 1 || isLoading}
          >
            Előző oldal
          </button>
          <span className="flex items-center px-4">
            {page}. oldal / {totalPages}
          </span>
          <button
            className="btn btn-primary"
            onClick={handleNextPage}
            disabled={page >= totalPages || isLoading}
          >
            Következő oldal
          </button>
        </div>
      )}
    </div>
  );
};

export default FilmekListazo;
