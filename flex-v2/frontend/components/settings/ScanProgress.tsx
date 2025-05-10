'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getScanStatus, cancelScan } from '@/app/lib/directoryApi';
import { ScanStatus } from '@/types/ScanStatus';

interface ScanProgressProps {
  dirPath?: string; // Opcionális specifikus könyvtár path
  onComplete?: () => void; // Callback amikor a szkennelés befejeződött
}

// Szkennelési folyamatjelző komponens
const ScanProgress: React.FC<ScanProgressProps> = ({ dirPath, onComplete }) => {
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastIsScanning, setLastIsScanning] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Szkennelési állapot lekérdezése
  const fetchStatus = useCallback(async () => {
    try {
      const scanStatus = await getScanStatus();

      // Ha volt szkennelés és befejeződött, hívjuk meg a callback-et
      if (lastIsScanning && !scanStatus.isScanning && onComplete) {
        onComplete();
      }

      setLastIsScanning(scanStatus.isScanning);
      setStatus(scanStatus);
      setError(null);
    } catch (err) {
      setError('Nem sikerült lekérdezni a szkennelés állapotát');
      console.error('Hiba a szkennelési állapot lekérdezése során:', err);
    }
  }, [lastIsScanning, onComplete]);

  // Szkennelés megszakítása
  const handleCancelScan = async () => {
    try {
      setIsCancelling(true);
      await cancelScan();
      // A státuszt a következő lekérdezés fogja frissíteni
    } catch (err) {
      setError('Nem sikerült megszakítani a szkennelést');
      console.error('Hiba a szkennelés megszakítása során:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Szkennelési állapot lekérdezése rendszeres időközönként
  useEffect(() => {
    // Azonnal lekérdezzük az állapotot
    fetchStatus();

    // Majd rendszeres időközönként frissítjük, ha aktív a szkennelés
    const intervalId = setInterval(() => {
      fetchStatus();
    }, 2000); // 2 másodpercenként frissítünk

    // Intervallum tisztítása unmountoláskor
    return () => clearInterval(intervalId);
  }, [fetchStatus]);

  // Ha nincs szkennelés folyamatban és nincs hiba, nem jelenítünk meg semmit
  if (!status?.isScanning && !error) {
    return null;
  }

  return (
    <div className="bg-base-200 rounded-lg p-4 mb-6 border border-base-300">
      {error ? (
        <div className="text-error">{error}</div>
      ) : status?.isScanning ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Szkennelés folyamatban</h3>
            <button
              onClick={handleCancelScan}
              className="btn btn-xs btn-error"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Megszakítás...
                </>
              ) : (
                'Megszakítás'
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <progress
                className="progress progress-primary w-full"
                value={status.progress}
                max="100"
              ></progress>
            </div>
            <div className="w-16 text-right">{Math.round(status.progress)}%</div>
          </div>

          {status.currentDirectory && (
            <div className="text-sm opacity-70 truncate">
              Jelenlegi mappa: {status.currentDirectory}
            </div>
          )}

          {status.currentFile && (
            <div className="text-sm opacity-70 truncate">Fájl: {status.currentFile}</div>
          )}

          <div className="text-sm grid grid-cols-2 gap-4 mt-2">
            <div>
              <span className="opacity-70">Fájlok: </span>
              <span className="font-medium">
                {status.scannedFiles} / {status.totalFiles || '?'}
              </span>
            </div>

            {status.startTime && (
              <div>
                <span className="opacity-70">Kezdés: </span>
                <span className="font-medium">
                  {new Date(status.startTime).toLocaleTimeString()}
                </span>
              </div>
            )}

            {status.estimatedEndTime && (
              <div>
                <span className="opacity-70">Várható befejezés: </span>
                <span className="font-medium">
                  {new Date(status.estimatedEndTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : status?.error ? (
        <div className="text-error flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{status.error}</span>
        </div>
      ) : (
        <div className="text-success flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Szkennelés befejezve!</span>
        </div>
      )}
    </div>
  );
};

export default ScanProgress;
