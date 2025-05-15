// Példa komponens az AuthContext használatára
'use client'
import React, { useState } from 'react'
import { useAuth } from '../provider/AuthContext'

export default function AuthDemo() {
  const { user, loading, login, register, logout } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'login') {
        await login(form.name, form.password)
      } else {
        await register(form.name, form.email, form.password)
      }
    } catch (err: any) {
      setError(err.message || 'Hiba')
    }
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: '2rem auto',
        padding: 24,
        border: '1px solid #ccc',
        borderRadius: 8
      }}
    >
      <h2>Auth példa</h2>
      {user ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <b>Bejelentkezve:</b> {user.name} ({user.email})
          </div>
          <button onClick={logout}>Kijelentkezés</button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <input
              name="name"
              placeholder="Név"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          {mode === 'register' && (
            <div style={{ marginBottom: 8 }}>
              <input
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <input
              name="password"
              type="password"
              placeholder="Jelszó"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <button type="submit" disabled={loading}>
              {mode === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
            </button>
            <button
              type="button"
              style={{ marginLeft: 8 }}
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Regisztráció' : 'Vissza a belépéshez'}
            </button>
          </div>
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </form>
      )}
      {loading && <div>Betöltés...</div>}
    </div>
  )
}
