import React from 'react';
import { Directory } from '@/app/lib/directoryApi';

interface SettingsHeaderProps {
  directories: Directory[];
  onAddClick: () => void;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ directories, onAddClick }) => {
  const totalFiles = directories.reduce((acc, dir) => acc + (dir.files_count || 0), 0);
  const scannedDirs = directories.filter((dir) => dir.files_count && dir.files_count > 0).length;
  const pendingDirs = directories.length - scannedDirs;

  // Különböző média típusok számításához (példa adatok - ezt valós adatokra kellene cserélni)
  const mediaTypes = {
    films: Math.floor(totalFiles * 0.6), // Példa: a fájlok 60%-a film
    series: Math.floor(totalFiles * 0.3), // Példa: a fájlok 30%-a sorozat
    other: Math.floor(totalFiles * 0.1), // Példa: a fájlok 10%-a egyéb
  };

  return (
    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Beállítások</h1>
        <p className="text-base-content/70">
          Itt kezelheted a médiakönyvtáraidat és más rendszerbeállításokat
        </p>

        {/* Részletes statisztika panel */}
        <div className="mt-3 p-3 bg-base-100 rounded-lg border border-base-300">
          <div className="text-lg font-semibold mb-2">Média összefoglaló</div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="stat-item">
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <span className="text-sm">Könyvtárak</span>
              </div>
              <div className="font-bold">{directories.length} db</div>
              <div className="text-xs">
                {scannedDirs} beszkennelve, {pendingDirs} függőben
              </div>
            </div>

            <div className="stat-item">
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
                <span className="text-sm">Összes fájl</span>
              </div>
              <div className="font-bold">{totalFiles} db</div>
              <div className="text-xs">
                {Math.round(totalFiles / (scannedDirs || 1))} fájl/könyvtár átlag
              </div>
            </div>

            <div className="stat-item">
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-accent"
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
                <span className="text-sm">Filmek</span>
              </div>
              <div className="font-bold">{mediaTypes.films} db</div>
              <div className="text-xs">
                {totalFiles > 0 ? Math.round((mediaTypes.films / totalFiles) * 100) : 0}% a teljes
                tartalomból
              </div>
            </div>

            <div className="stat-item">
              <div className="flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-info"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">Sorozatok</span>
              </div>
              <div className="font-bold">{mediaTypes.series} db</div>
              <div className="text-xs">
                {totalFiles > 0 ? Math.round((mediaTypes.series / totalFiles) * 100) : 0}% a teljes
                tartalomból
              </div>
            </div>
          </div>
        </div>
      </div>
      <button onClick={onAddClick} className="btn btn-primary">
        + Könyvtár hozzáadása
      </button>
    </div>
  );
};

export default SettingsHeader;
