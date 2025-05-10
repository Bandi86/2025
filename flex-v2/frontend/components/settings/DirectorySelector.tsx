'use client';

import React, { useState, useEffect } from 'react';
import { fetchFilesystem, addDirectory } from '@/app/lib/directoryApi';

interface DirectorySelectorProps {
  onDirectoryAdded: () => void;
  onClose: () => void;
}

const DirectorySelector: React.FC<DirectorySelectorProps> = ({ onDirectoryAdded, onClose }) => {
  // Jelenlegi útvonal és tartalom
  const [currentPath, setCurrentPath] = useState<string>('');
  const [directories, setDirectories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Betöltés alatt álló állapot
  const [addingDirectory, setAddingDirectory] = useState<boolean>(false);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

  // Könyvtárstruktúra betöltése
  useEffect(() => {
    const loadDirectories = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchFilesystem(currentPath);
        // Ellenőrizzük, hogy a válasz tartalmaz-e directories tömböt, és az tömbként van-e definiálva
        setDirectories(Array.isArray(response?.directories) ? response.directories : []);
      } catch (err) {
        setError('Hiba történt a könyvtárak betöltése során');
        console.error('Könyvtárak betöltési hiba:', err);
        setDirectories([]); // Hiba esetén üres tömböt állítunk be
      } finally {
        setLoading(false);
      }
    };

    loadDirectories();
  }, [currentPath]);

  // Mappa kiválasztása
  const handleSelectDirectory = (dir: string) => {
    setSelectedDirectory(dir);
  };

  // Mappa hozzáadása a szkenneléshez
  const handleAddDirectory = async () => {
    if (!selectedDirectory) return;

    setAddingDirectory(true);

    try {
      await addDirectory(selectedDirectory);
      onDirectoryAdded();
      onClose();
    } catch (err) {
      setError('Nem sikerült hozzáadni a mappát');
      console.error('Könyvtár hozzáadási hiba:', err);
    } finally {
      setAddingDirectory(false);
    }
  };

  // Navigálás másik mappába
  const navigateToDirectory = (dir: string) => {
    // Abszolút út esetén közvetlenül navigálunk
    if (dir.startsWith('/')) {
      setCurrentPath(dir);
    }
    // Ha '..' akkor egy szinttel feljebb lépünk
    else if (dir === '..') {
      const parts = currentPath.split('/');
      parts.pop();
      setCurrentPath(parts.join('/'));
    }
    // Relatív út esetén hozzáadjuk a jelenlegi úthoz
    else {
      const newPath = currentPath ? `${currentPath}/${dir}` : dir;
      setCurrentPath(newPath);
    }
  };

  // Mappa elérési útjának szebb megjelenítése
  const formatPath = (path: string) => {
    if (!path) return 'Fő könyvtárak';

    const parts = path.split('/');
    // Ha túl hosszú, csak az elejét és végét mutatjuk
    if (parts.length > 4) {
      return `${parts[0]}/.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }
    return path;
  };

  // Könyvtárstruktúra megjelenítése
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        {/* Fejléc */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h3 className="text-lg font-medium">Válassz mappát</h3>
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Jelenlegi útvonal */}
        <div className="p-4 bg-base-200 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 opacity-60"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
              clipRule="evenodd"
            />
          </svg>
          <div className="font-medium truncate">{formatPath(currentPath)}</div>
        </div>

        {/* Mappák listája */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : error ? (
            <div className="text-error py-4">{error}</div>
          ) : directories.length === 0 ? (
            <div className="text-center py-4 opacity-70">Nincsenek elérhető mappák</div>
          ) : (
            <div className="space-y-2">
              {/* Vissza gomb, ha nem a gyökérben vagyunk */}
              {currentPath && (
                <div
                  className="p-2 hover:bg-base-200 rounded-lg cursor-pointer flex items-center gap-2"
                  onClick={() => navigateToDirectory('..')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Vissza</span>
                </div>
              )}

              {/* Mappák listája */}
              {directories.map((dir, index) => {
                const fullPath = currentPath ? `${currentPath}/${dir}` : dir;
                const isSelected = selectedDirectory === fullPath;

                return (
                  <div
                    key={index}
                    className={`p-2 hover:bg-base-200 rounded-lg cursor-pointer flex items-center gap-2 ${
                      isSelected ? 'bg-primary/10 border border-primary/30' : ''
                    }`}
                    onClick={() => handleSelectDirectory(fullPath)}
                    onDoubleClick={() => navigateToDirectory(dir)}
                  >
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
                    <span className="truncate">{dir}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alsó sáv gombokkal */}
        <div className="p-4 border-t border-base-300 flex justify-end gap-2">
          <div className="flex-1 text-sm opacity-70">
            {selectedDirectory ? (
              <div className="truncate">Kiválasztva: {selectedDirectory}</div>
            ) : (
              <div>
                Kattints duplán egy mappára a belépéshez, vagy válassz ki egyet a hozzáadáshoz
              </div>
            )}
          </div>
          <button onClick={onClose} className="btn btn-ghost">
            Mégsem
          </button>
          <button
            onClick={handleAddDirectory}
            className="btn btn-primary"
            disabled={!selectedDirectory || addingDirectory}
          >
            {addingDirectory ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Hozzáadás...
              </>
            ) : (
              'Hozzáadás'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectorySelector;
