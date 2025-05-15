'use client'
import React, { useState } from 'react'
import { useAuth } from '../../provider/AuthContext'
import clsx from 'clsx'
import { useRouter, useSearchParams } from 'next/navigation'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const { login, register, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  // Ha a mód vált, ürítsük az error-t és az email mezőt, ha loginra váltunk
  React.useEffect(() => {
    setError(null)
    setForm((f) => ({
      ...f,
      email: mode === 'register' ? f.email : ''
    }))
  }, [mode])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'login') {
        await login(form.name, form.password)
        // Redirect to the home page or any other page
        router.push('/')
      } else {
        await register(form.name, form.email, form.password)
        // Regisztráció után automatikusan bejelentkezés
        await login(form.name, form.password)
        // Redirect to the home page or any other page
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'Hiba')
    }
  }

  // Mode váltás router-rel, query string módosításával
  const handleModeSwitch = () => {
    const newMode = mode === 'login' ? 'register' : 'login'
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', newMode)
    router.push(`/auth?${params.toString()}`)
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {mode === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Név
          </label>
          <input
            id="name"
            name="name"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Név"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Jelszó
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Jelszó"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className={clsx(
              'flex-1 py-2 rounded text-white font-semibold',
              loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700',
              'transition-colors duration-150'
            )}
          >
            {mode === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors duration-150"
            onClick={handleModeSwitch}
          >
            {mode === 'login' ? 'Regisztráció' : 'Vissza a belépéshez'}
          </button>
        </div>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        {loading && <div className="text-gray-500 text-sm mt-2">Betöltés...</div>}
      </form>
    </div>
  )
}
