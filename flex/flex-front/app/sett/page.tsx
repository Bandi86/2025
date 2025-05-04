'use client'
import React, { useState } from 'react';

const SettingsPage = () => {
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) throw new Error('Hiba a könyvtár hozzáadásakor');
      setSuccess(true);
      setPath('');
    } catch (err: any) {
      setError(err.message || 'Ismeretlen hiba');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 card bg-base-100 shadow p-8">
      <h2 className="card-title mb-4">Könyvtár hozzáadása</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="form-control w-full">
          <span className="label-text mb-1">Könyvtár elérési útja</span>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="/home/filmek"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Feldolgozás...' : 'Hozzáadás'}
        </button>
        {success && <div className="alert alert-success mt-2">Sikeres hozzáadás!</div>}
        {error && <div className="alert alert-error mt-2">{error}</div>}
      </form>
    </div>
  );
}

export default SettingsPage;