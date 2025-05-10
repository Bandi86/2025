import React, { useState } from 'react';
import { addDirectory } from '@/app/lib/directoryApi';

interface DirectoryAddModalProps {
  onClose: () => void;
  onDirectoryAdded: () => void;
}

const DirectoryAddModal: React.FC<DirectoryAddModalProps> = ({ onClose, onDirectoryAdded }) => {
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addDirectory(path);
      onDirectoryAdded();
      onClose();
    } catch (err) {
      setError('Nem sikerült hozzáadni a könyvtárat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Könyvtár hozzáadása</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="/elérési/út/a/könyvtárhoz"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            required
          />
          {error && <div className="text-error text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Mégsem
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !path}>
              {loading ? 'Hozzáadás...' : 'Hozzáadás'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectoryAddModal;
