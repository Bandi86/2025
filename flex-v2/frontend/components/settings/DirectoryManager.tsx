'use client';

import React, { useState, useEffect } from 'react';
import {
  Directory,
  listDirectories,
  removeDirectory,
  startScan,
  getScanStatus,
} from '@/app/lib/directoryApi';
import DirectorySelector from './DirectorySelector';
import ScanProgress from './ScanProgress';

interface DirectoryManagerProps {
  onScanStarted: () => void;
}

const DirectoryManager: React.FC<DirectoryManagerProps> = ({ onScanStarted }) => {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanningPath, setScanningPath] = useState<string | null>(null);

  // Szkennelt könyvtárak lekérdezése
  const loadDirectories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dirs = await listDirectories();
      setDirectories(dirs);
    } catch (err) {
      setError('Nem sikerült betölteni a könyvtárakat');
      console.error('Könyvtárak betöltési hiba:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Kezdeti betöltés
  useEffect(() => {
    loadDirectories();
  }, []);

  // Szkennelés befejezése után automatikusan újratöltjük a könyvtárak listáját
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isScanning) {
      interval = setInterval(async () => {
        try {
          // const ScanProgressModule = await import('./ScanProgress');
          //const { getScanStatus } = ScanProgressModule;

          const status = await getScanStatus(); // Assuming getScanStatus is a function that fetches the status
          if (status && !status.isScanning) {
            await loadDirectories();
            setIsScanning(false);
            if (interval) clearInterval(interval);
          }
        } catch (e) {
          // ignore
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning]);

  // Könyvtár törlése
  const handleDeleteDirectory = async (dirId: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a könyvtárat a szkennelésből?')) {
      try {
        await removeDirectory(dirId);
        await loadDirectories();
      } catch (err) {
        setError('Hiba történt a könyvtár törlésekor');
        console.error('Könyvtár törlési hiba:', err);
      }
    }
  };

  // Szkennelés indítása
  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      // Átadjuk az összes könyvtár path-ját
      await startScan(directories.map((d) => d.path));
      onScanStarted();
    } catch (err) {
      setError('Nem sikerült elindítani a szkennelést');
      console.error('Szkennelés indítási hiba:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Egyedi könyvtár szkennelése
  const handleScanSingleDirectory = async (dirPath: string) => {
    setIsScanning(true);
    setScanningPath(dirPath);
    try {
      await startScan([dirPath]);
      // A ScanProgress komponens automatikusan mutatja az állapotot
      await loadDirectories(); // Frissítjük a könyvtárak listáját szkennelés után
    } catch (err) {
      setError('Nem sikerült elindítani a szkennelést');
      console.error('Szkennelés indítási hiba:', err);
    } finally {
      setIsScanning(false);
      setScanningPath(null);
    }
  };

  // Mappa nevének kiemelése a teljes elérési útból
  const extractDirectoryName = (path: string): string => {
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  // Szülő mappa elérési útjának kinyerése
  const extractParentPath = (path: string): string => {
    const parts = path.split('/');
    // Eltávolítjuk az utolsó elemet (a mappa nevét)
    parts.pop();
    return parts.join('/');
  };

  return (
    <div className="space-y-6">
      {/* Fejléc statisztikákkal */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Szkennelt könyvtárak</h2>

          {/* Részletes statisztika blokk */}
          <div className="mt-2 bg-base-100 rounded p-2 border border-base-300">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="stat-card">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <div className="font-medium">Könyvtárak:</div>
                  <div className="ml-1 font-bold">{directories.length} db</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1 text-secondary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="font-medium">Fájlok:</div>
                  <div className="ml-1 font-bold">
                    {directories.reduce((acc, dir) => acc + (dir.files_count || 0), 0)} db
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1 text-accent"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="font-medium">Szkennelési állapot:</div>
                  <div className="ml-1 font-bold">
                    {directories.filter((dir) => dir.files_count && dir.files_count > 0).length} /{' '}
                    {directories.length} kész
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1 text-info"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                  </svg>
                  <div className="font-medium">Átlagos méret:</div>
                  <div className="ml-1 font-bold">
                    {directories.filter((d) => d.files_count && d.files_count > 0).length > 0
                      ? Math.round(
                          directories.reduce((acc, dir) => acc + (dir.files_count || 0), 0) /
                            directories.filter((d) => d.files_count && d.files_count > 0).length
                        )
                      : 0}{' '}
                    fájl/könyvtár
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowSelector(true)} className="btn btn-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Könyvtár hozzáadása
          </button>

          <button
            onClick={handleStartScan}
            className="btn btn-accent"
            disabled={directories.length === 0 || isScanning}
          >
            {isScanning ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Szkennelés...
              </>
            ) : (
              <>
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
                Újraszkennelés
              </>
            )}
          </button>
        </div>
      </div>

      {/* Könyvtárak listája fölé helyezzük a progress bart */}
      <ScanProgress />

      {/* Hibaüzenet megjelenítése */}
      {error && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 stroke-current shrink-0"
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
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn btn-sm">
            Bezárás
          </button>
        </div>
      )}

      {/* Könyvtárak listája */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : directories?.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-5xl mb-4 opacity-20">📁</div>
          <h3 className="text-xl font-medium mb-2">Még nincsenek szkennelt könyvtárak</h3>
          <p className="text-base-content/70 mb-4">
            Adj hozzá könyvtárakat a gépedről a médiatartalmak indexeléséhez
          </p>
          <button onClick={() => setShowSelector(true)} className="btn btn-primary">
            Könyvtár hozzáadása
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {directories?.map((dir) => (
            <div key={dir.id} className="card bg-base-200 shadow-sm hover:shadow transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-lg flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="truncate">{extractDirectoryName(dir.path)}</span>
                </h3>

                <div className="text-sm text-base-content/70 mb-2 truncate">
                  {extractParentPath(dir.path)}
                </div>

                {/* Részletes könyvtár információk */}
                <div className="mt-2 mb-3 grid grid-cols-2 gap-2 text-sm border-t border-base-300 pt-2">
                  <div className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-secondary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Fájlok:</span>
                    <span>{dir.files_count || 0} db</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Státusz:</span>
                    <span className={`${dir.files_count ? 'text-success' : 'text-warning'}`}>
                      {dir.files_count && dir.files_count > 0 ? 'Szkennelve' : 'Nincs szkennelve'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-accent"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="font-medium">Típus:</span>
                    <span>
                      {extractDirectoryName(dir.path).toLowerCase().includes('film')
                        ? 'Filmes könyvtár'
                        : extractDirectoryName(dir.path).toLowerCase().includes('kép') ||
                          extractDirectoryName(dir.path).toLowerCase().includes('photo')
                        ? 'Képek'
                        : 'Egyéb média'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-info"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Utolsó szkennelés:</span>
                    <span>
                      {dir.last_scan_date
                        ? new Date(dir.last_scan_date).toLocaleDateString()
                        : 'Még nem volt'}
                    </span>
                  </div>
                </div>

                {/* Státusz indikátor */}
                <div className="w-full bg-base-300 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full ${
                      dir.files_count ? 'bg-success' : 'bg-warning'
                    }`}
                    style={{ width: `${dir.files_count ? '100' : '0'}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    {dir.files_count ? (
                      <span className="badge badge-success">{dir.files_count} fájl</span>
                    ) : (
                      <span className="badge badge-warning">Nincs beszkennelve</span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    {(!dir.files_count || dir.files_count === 0) && (
                      <button
                        onClick={() => handleScanSingleDirectory(dir.path)}
                        className="btn btn-xs btn-outline btn-accent"
                        disabled={isScanning}
                        title="Könyvtár szkennelése"
                      >
                        {isScanning && scanningPath === dir.path ? 'Szkennelés...' : 'Szkennelés'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDirectory(dir.id)}
                      className="btn btn-sm btn-ghost text-error"
                      title="Könyvtár törlése"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Status bar csak az adott könyvtár alatt jelenik meg szkenneléskor */}
                {scanningPath === dir.path && isScanning && (
                  <div className="mt-2">
                    <ScanProgress />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Könyvtárválasztó megjelenítése */}
      {showSelector && (
        <DirectorySelector
          onDirectoryAdded={loadDirectories}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
};

export default DirectoryManager;
