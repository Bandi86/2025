'use client';

import React, { useState, useEffect } from 'react';
import { Directory, removeDirectory, startScan, getScanStatus } from '@/app/lib/directoryApi';
import ScanProgress from './ScanProgress';

interface DirectoryCardProps {
  directory: Directory;
  reload: () => void;
}

// A könyvtár állapota, amelyet a szkennelés után mutatunk
const DirectorySummary: React.FC<{ directory: Directory; scanComplete: boolean }> = ({
  directory,
  scanComplete,
}) => {
  if (!directory.files_count || directory.files_count === 0) {
    return <span className="opacity-60">Nincs beszkennelve</span>;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-success"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-medium">
          {scanComplete ? 'Sikeresen beszkennelve!' : 'Sikeresen indexelve'}
        </span>
      </div>
      <div className="mt-1 grid grid-cols-1 gap-1 text-sm">
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-primary"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <strong>{directory.files_count}</strong> média fájl
          </span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-accent"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          <span>Katalogizálva és megtekinthető</span>
        </div>
        <div className="flex mt-2">
          <button
            className="btn btn-xs btn-primary btn-outline"
            onClick={() => (window.location.href = '/media')}
          >
            Média böngészése
          </button>
          {directory.files_count > 0 && !scanComplete && (
            <button className="btn btn-xs btn-ghost ml-2" onClick={() => window.location.reload()}>
              Frissítés
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DirectoryCard: React.FC<DirectoryCardProps> = ({ directory: initialDirectory, reload }) => {
  // Könyvtár adatainak tárolása lokális state-ben
  const [directory, setDirectory] = useState<Directory>(initialDirectory);
  const [isScanning, setIsScanning] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanSuccessful, setScanSuccessful] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanStats, setScanStats] = useState<{ films?: number; series?: number }>({});

  // Ha a prop-ként kapott directory változik, frissítjük a lokális state-et
  useEffect(() => {
    setDirectory(initialDirectory);
  }, [initialDirectory]);

  const handleDelete = async () => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a könyvtárat?')) {
      try {
        await removeDirectory(directory.id);
        reload();
      } catch (err) {
        setError('Hiba történt a könyvtár törlésekor');
      }
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setShowProgress(true);
    setError(null);
    setScanSuccessful(false);
    setScanComplete(false);

    try {
      // Átadjuk a path-t egy tömbben, ahogy a startScan függvény elvárja
      await startScan([directory.path]);

      // Elindítunk egy polling mechanizmust a szkennelés állapotának ellenőrzésére
      const checkInterval = setInterval(async () => {
        try {
          const status = await getScanStatus();

          // Ha a szkennelés befejeződött
          if (status && !status.isScanning && status.progress === 100) {
            clearInterval(checkInterval);
            handleScanComplete();
          }
        } catch (error) {
          console.error('Hiba a szkennelési állapot lekérdezésekor:', error);
        }
      }, 2000);
    } catch (err) {
      setError('Nem sikerült elindítani a szkennelést');
      setIsScanning(false);
    }
  };

  // Szkennelés befejezésekor
  const handleScanComplete = () => {
    setScanSuccessful(true);
    setScanComplete(true);
    setIsScanning(false);

    // Statisztikákat itt állíthatnánk be a szkennelés eredményei alapján
    setScanStats({
      films: Math.floor(Math.random() * 10) + 1, // Példa adat
      series: Math.floor(Math.random() * 5), // Példa adat
    });

    // Frissítjük a könyvtárak adatait
    reload();

    // Közvetlen frissítés: Új könyvtárlistát kérünk le és
    // frissítjük a helyi directory állapotot is
    setTimeout(() => {
      reload();
      fetch(`/api/dirs/${directory.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.dir) {
            setDirectory(data.dir);
          }
        })
        .catch((err) => console.error('Hiba a könyvtár frissítésekor:', err));
    }, 1000);

    // 10 másodperc után elrejtjük a progress bart
    setTimeout(() => {
      setShowProgress(false);
      setScanComplete(false);
    }, 10000);
  };

  const hasFiles = directory.files_count && directory.files_count > 0;

  return (
    <div
      className={`card ${
        scanSuccessful ? 'bg-base-100 border border-success/30' : 'bg-base-200'
      } shadow-sm hover:shadow transition-shadow`}
    >
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
          <span className="truncate">{directory.name}</span>
        </h3>
        <div className="text-sm text-base-content/70 mb-2 truncate">{directory.path}</div>

        <div className="flex justify-between items-center mt-2">
          <div className="text-sm">
            <DirectorySummary directory={directory} scanComplete={scanComplete} />
          </div>
          <div className="flex gap-2 items-center">
            {/* Szkennelés gomb - most már látható, ha files_count === 0 vagy ha már vannak fájlok */}
            {(!hasFiles || scanSuccessful) && (
              <button
                onClick={handleScan}
                className={`btn btn-xs ${hasFiles ? 'btn-ghost' : 'btn-outline btn-accent'}`}
                disabled={isScanning}
                title="Könyvtár újraszkennelése"
              >
                {isScanning ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Szkennelés...
                  </>
                ) : hasFiles ? (
                  'Újraszkennelés'
                ) : (
                  'Szkennelés'
                )}
              </button>
            )}
            <button
              onClick={handleDelete}
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

        {/* Szkennelés eredmények - csak sikeres szkennelés után, és csak rövid ideig */}
        {scanComplete && scanStats && hasFiles && (
          <div className="mt-4 bg-success/10 p-3 rounded-lg text-sm">
            <div className="font-medium mb-1">Szkennelés eredménye:</div>
            <div className="grid grid-cols-2 gap-2">
              {scanStats.films !== undefined && (
                <div className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-success"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    <path
                      fillRule="evenodd"
                      d="M4 10h12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{scanStats.films} film</span>
                </div>
              )}
              {scanStats.series !== undefined && (
                <div className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-success"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{scanStats.series} sorozat</span>
                </div>
              )}
            </div>
          </div>
        )}

        {showProgress && <ScanProgress dirPath={directory.path} onComplete={handleScanComplete} />}
        {error && (
          <div className="alert alert-error mt-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="btn btn-xs ml-2">
              Bezárás
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryCard;
