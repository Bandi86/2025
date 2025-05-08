'use client'
import React, { useState, useEffect } from 'react'
import { useUser } from '../UserContext'
import { handleDeleteFolders } from '../helpers/handleDeleteFolders'
import axios from 'axios' // Axios importálása

const SettingsPage = () => {
  const { user, fetchScannedDirsCount } = useUser() // fetchScannedDirsCount hozzáadva
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
    setLoading(true)
    try {
      // Axios GET kérés használata
      const res = await axios.get('http://localhost:8000/api/dirs', {
        // A cache: 'no-store' axios-ban alapértelmezettként vagy másképp kezelendő,
        // tipikusan a backend oldalon cache-control headerekkel, vagy query paraméterrel, ha szükséges.
        // Axios GET kérések alapból nem cache-elnek úgy, mint a fetch böngésző API.
      })
      // Axios esetén a res.data tartalmazza a választ
      const data = res.data
      const rootDirs = data.dirs
        .map((dir: string) => {
          const parts = dir.split('\\')
          return parts.slice(0, Math.min(parts.length, 3)).join('\\')
        })
        .filter(Boolean)

      setAddedDirs(Array.from(new Set(rootDirs)))
      setError('')
      await fetchScannedDirsCount() // Frissítjük a globális mappaszámot is
    } catch (e: any) {
      if (axios.isAxiosError(e) && e.response) {
        setError(
          `Hiba a mappák lekérésekor: ${e.response.status} - ${
            e.response.data?.message || e.response.data?.error || e.message
          }`
        )
      } else {
        setError(e.message || 'Nem sikerült lekérni a mappákat.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      // Csak akkor hívjuk meg, ha van bejelentkezett felhasználó
      fetchDirs()
    }
  }, [user]) // user dependency hozzáadva, hogy bejelentkezés után lefusson

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')
    try {
      // Axios POST kérés használata
      const res = await axios.post('http://localhost:8000/api/scan', {
        paths: [path]
      })
      // Axios esetén a res.data tartalmazza a választ
      const result = res.data
      // Axios hibát dob nem 2xx válaszok esetén, így a result.error ellenőrzés kevésbé releváns itt,
      // hacsak a backend 2xx státusszal is küldhet hibát a body-ban.
      // if (result.error) throw new Error(result.error || 'Hiba a könyvtár hozzáadásakor');

      setSuccess(true)
      const newPathToAdd = path.replace(/\//g, '\\')
      setAddedDirs((prevDirs) => Array.from(new Set([...prevDirs, newPathToAdd])))
      setPath('')
      await fetchDirs() // Ez meghívja fetchScannedDirsCount-ot is
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data?.message || err.response.data?.error || 'Hiba a könyvtár hozzáadásakor'
        )
      } else {
        setError(err.message || 'Ismeretlen hiba')
      }
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
      await fetchDirs() // Ez meghívja fetchScannedDirsCount-ot is

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
