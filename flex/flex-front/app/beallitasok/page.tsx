'use client'
import React, { useState, useEffect } from 'react'
import { useUser } from '../UserContext'
import { handleDeleteFolders } from '../helpers/handleDeleteFolders'

const SettingsPage = () => {
  const { user } = useUser()
  // Ha nincs bejelentkezve, ne jelenjen meg a beállítás oldal
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 card bg-base-100 shadow p-8 text-center">
        <h2 className="text-xl font-bold mb-2">
          Ez az oldal csak bejelentkezett felhasználók számára elérhető.
        </h2>
        <p>Kérlek, jelentkezz be a beállítások megtekintéséhez.</p>
      </div>
    )
  }

  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [addedDirs, setAddedDirs] = useState<string[]>([])

  // A fetchDirs függvény a könyvtárak lekérésére szolgál
  async function fetchDirs() {
    setLoading(true) // Betöltési állapot beállítása
    // setError(''); // Hibát csak sikeres lekérés után vagy explicit törléskor ürítünk
    try {
      const res = await fetch('http://localhost:8000/api/dirs', {
        cache: 'no-store' // Cache-elés tiltása a böngésző oldalon
      })
      if (res.ok) {
        const data = await res.json()
        // Windows útvonalak kezelése (backslash), és csak a fő mappákat vesszük
        // A slice(0,3) logika megmarad, feltételezve, hogy a backend fájl elérési utakat ad vissza,
        // és ebből próbáljuk kinyerni a gyökér scannelt mappákat.
        const rootDirs = data.dirs
          .map((dir: string) => {
            const parts = dir.split('\\')
            // Biztonságosabb slice, hogy ne legyen hiba, ha parts rövidebb
            return parts.slice(0, Math.min(parts.length, 3)).join('\\')
          })
          .filter(Boolean) // Eltávolítja az esetleges üres stringeket

        setAddedDirs(Array.from(new Set(rootDirs)))
        setError('') // Sikeres lekérés esetén hiba törlése
      } else {
        // Hiba kezelése, ha a backend nem 200 OK-t ad vissza
        const errorText = await res.text().catch(() => 'Ismeretlen szerverhiba')
        // A hibaüzenet kiírása a felhasználónak
        setError(`Hiba a mappák lekérésekor: ${res.status} - ${errorText}`)
      }
    } catch (e: any) {
      setError(e.message || 'Nem sikerült lekérni a mappákat.')
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

      const newPathToAdd = path.replace(/\//g, '\\')
      // Az optimista frissítés itt a felhasználó által beírt útvonalat adja hozzá.
      // A fetchDirs a végén majd a szerver által visszaadott, feldolgozott (gyökér) mappákat fogja beállítani.
      setAddedDirs((prevDirs) => Array.from(new Set([...prevDirs, newPathToAdd])))

      setPath('') // Input mező ürítése

      await fetchDirs()
    } catch (err: any) {
      setError(err.message || 'Ismeretlen hiba')
    } finally {
      setLoading(false)
    }
  }

  // Wrapper függvény a mappák törléséhez és a lista újratöltéséhez
  const handleDeleteAndRefetch = async () => {
    setLoading(true)
    setError('')
    // setSuccess(false); // Ha van külön success state a törléshez
    try {
      // Feltételezzük, hogy a handleDeleteFolders egy Promise-t ad vissza
      // és hibát dob, ha a törlés nem sikerül.
      await handleDeleteFolders()

      // Sikeres törlés után a fetchDirs frissíti a listát.
      // Mivel a szerver oldalon a /dirs végpont már csak létező fájlok alapján ad vissza mappákat,
      // és a handleDeleteFolders törli az adatbázisból az elemeket,
      // a fetchDirs várhatóan üres listát (vagy a megmaradt mappákat) fog visszaadni.
      await fetchDirs()

      // Opcionálisan itt beállíthatunk egy sikeres törlés üzenetet, ha van rá state.
      // Például: setSuccessMessage('Minden mappa sikeresen törölve.');
    } catch (err: any) {
      setError(err.message || 'Hiba a mappák törlése közben.')
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
        {addedDirs.length > 0 && error && <div className="alert alert-error mt-2">{error}</div>}
      </form>
      {addedDirs.length > 0 && (
        <div className="mt-8 flex justify-center gap-6">
          <h1>Összes hozzáadott mappa törlése:</h1>
          <button
            className="btn btn-primary join-item"
            type="button" // Típust 'button'-ra állítjuk, hogy ne okozzon form submit-ot
            disabled={loading}
            onClick={handleDeleteAndRefetch} // Itt használjuk az új wrapper függvényt
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
