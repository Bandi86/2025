import React, { useState, useEffect } from 'react';
import SettingsHeader from './SettingsHeader';
import DirectoryList from './DirectoryList';
import DirectoryAddModal from './DirectoryAddModal';
import ErrorAlert from './ErrorAlert'
import EmptyState from './EmptyState';
import { Directory, listDirectories } from '@/app/lib/directoryApi';

const SettingsPage: React.FC = () => {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadDirectories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dirs = await listDirectories();
      setDirectories(dirs);
    } catch (err) {
      setError('Nem sikerült betölteni a könyvtárakat');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectories();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <SettingsHeader directories={directories} onAddClick={() => setShowAddModal(true)} />
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : directories.length === 0 ? (
        <EmptyState onAddClick={() => setShowAddModal(true)} />
      ) : (
        <DirectoryList directories={directories} reload={loadDirectories} />
      )}
      {showAddModal && (
        <DirectoryAddModal
          onClose={() => setShowAddModal(false)}
          onDirectoryAdded={loadDirectories}
        />
      )}
    </div>
  );
};

export default SettingsPage;
