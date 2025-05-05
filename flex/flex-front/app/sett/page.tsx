'use client'
import React, { useState, useEffect } from 'react'
import { handleDeleteFolders } from '../helpers/handleDeleteFolders'

const SettingsPage = () => {
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [addedDirs, setAddedDirs] = useState<string[]>([])

  async function fetchDirs() {
    try {
      const res = await fetch('http://localhost:8000/api/dirs')
      if (res.ok) {
        const data = await res.json()
        const rootDirs = data.dirs.map((dir: string) => dir.split('/').slice(0, 2).join('/'))
        setAddedDirs(Array.from(new Set(rootDirs)))
      }
    } catch {
      setError('Nem sikerült lekérni a mappákat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDirs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')
    try {
      const res = await fetch('http://localhost:8000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [path] })
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || 'Hiba a könyvtár hozzáadásakor')
      setSuccess(true)
      setPath('')
      await fetchDirs()
    } catch (err: any) {
      setError(err.message || 'Ismeretlen hiba')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 card bg-base-100 shadow p-8">
      <h2 className="card-title mb-4">Könyvtár hozzáadása</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="form-control w-full">
          <span className="label-text">Könyvtár elérési útja</span>
          <div className="join w-full">
            <input
              type="text"
              className="input input-bordered join-item w-full"
              placeholder="G:\Filmek"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              required
            />
            <button className="btn btn-primary join-item" type="submit" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-xs"></span> : 'Hozzáadás'}
            </button>
          </div>
        </label>
        {success && <div className="alert alert-success mt-2">Sikeres hozzáadás!</div>}
        {error && <div className="alert alert-error mt-2">{error}</div>}
      </form>
      {addedDirs.length > 0 && (
        <div className="mt-8 flex justify-center gap-6">
          <h1>Összes hozzáadott mappa törlése:</h1>
          <button
            className="btn btn-primary join-item"
            type="submit"
            disabled={loading}
            onClick={handleDeleteFolders}
          >
            Törlés
          </button>
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-bold mb-2">Hozzáadott mappák</h3>
        {addedDirs.length === 0 ? (
          <div className="alert alert-info">Nincs még hozzáadott mappa.</div>
        ) : (
          <ul className="list list-disc pl-4">
            {addedDirs.map((dir) => (
              <li key={dir} className="mb-1 text-sm">
                {dir}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
