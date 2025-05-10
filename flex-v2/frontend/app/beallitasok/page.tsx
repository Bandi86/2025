'use client';

import React, { useState } from 'react';
import DirectoryManager from '@/components/settings/DirectoryManager';
import ScanProgress from '@/components/settings/ScanProgress';

const SettingsPage = () => {
  const [showScanProgress, setShowScanProgress] = useState(false);

  const handleScanStarted = () => {
    setShowScanProgress(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Beállítások</h1>
        <p className="text-base-content/70">
          Itt kezelheted a médiakönyvtáraidat és más rendszerbeállításokat
        </p>
      </div>

      {/* Szkennelési folyamatjelző */}
      {showScanProgress && <ScanProgress />}

      {/* Könyvtárkezelés */}
      <DirectoryManager onScanStarted={handleScanStarted} />

      {/* Itt később további beállítási szekciók adhatók hozzá */}
      <div className="divider my-10"></div>

      <div className="card bg-base-200 shadow-sm p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">További beállítások</h2>
        <p className="text-base-content/70 mb-4">
          További rendszerbeállítások a jövőben itt lesznek elérhetők.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Automatikus szkennelés</span>
            </label>
            <label className="cursor-pointer flex items-center gap-3">
              <input type="checkbox" className="toggle toggle-primary" disabled />
              <span className="opacity-60">Hamarosan elérhető</span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Metaadatok frissítése</span>
            </label>
            <label className="cursor-pointer flex items-center gap-3">
              <input type="checkbox" className="toggle toggle-primary" disabled />
              <span className="opacity-60">Hamarosan elérhető</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
