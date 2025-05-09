import React, { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/app/UserContext'

const LoginForm = () => {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useUser() // login funkció a UserContext-ből

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // A UserContext login funkciójának használata
      await login({ username: form.username, password: form.password })
      // Sikeres bejelentkezés után a UserContext frissíti a felhasználói állapotot
      // és a cookie-t a szerver már beállította.
      // Nincs szükség manuális token mentésre vagy setUser hívásra itt.
      window.location.href = '/' // Átirányítás a főoldalra
    } catch (err: any) {
      // A UserContext login funkciója már kezeli a hibát és továbbdobja azt,
      // így itt csak meg kell jeleníteni.
      setError(err.response?.data?.message || err.message || 'Ismeretlen bejelentkezési hiba')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-base-100 p-8 rounded-xl shadow-lg flex flex-col gap-4 mt-8"
    >
      <h2 className="text-2xl font-bold mb-2 text-center">Bejelentkezés</h2>
      <label className="label">Felhasználónév</label>
      <input
        type="text"
        name="username"
        placeholder="Felhasználónév"
        className="input input-bordered w-full"
        value={form.username}
        onChange={handleChange}
        required
      />
      <label className="label">Jelszó</label>
      <input
        type="password"
        name="password"
        placeholder="Jelszó"
        className="input input-bordered w-full"
        value={form.password}
        onChange={handleChange}
        required
      />
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
      </button>
      <div className="text-center text-sm mt-2">
        Nincs fiókod?{' '}
        <Link href="/auth/?register" className="link link-primary">
          Regisztrálj!
        </Link>
      </div>
    </form>
  )
}

export default LoginForm
