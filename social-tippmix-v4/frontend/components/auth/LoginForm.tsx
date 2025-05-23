'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/useAuth'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login({ username, password })
    if (success) {
      router.push('/')
      window.location.reload()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
          <button onClick={clearError} className="float-right" aria-label="Close error message">
            ×
          </button>
        </div>
      )}

      <div>
        <label
          htmlFor="username"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Username
        </label>
        <input
          type="text"
          name="username"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input input-bordered w-full"
          placeholder="your_username"
          required
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input input-bordered w-full"
          placeholder="••••••••"
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-start">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      <div className="text-sm font-light text-gray-500 dark:text-gray-400">
        Don't have an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register here
        </Link>
      </div>
    </form>
  )
}
