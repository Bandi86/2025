'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store'
import axiosClient from '@/lib/axios/axios-config-client'

export default function RegisterFormZustand() {
  const router = useRouter()
  const { setError, error, clearError } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Töröljük az esetleges validációs hibát ennél a mezőnél
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationErrors({})

    // Jelszó egyezés ellenőrzése
    if (formData.password !== formData.confirmPassword) {
      setValidationErrors({ confirmPassword: 'A jelszavak nem egyeznek' })
      return
    }

    setLoading(true)

    try {
      await axiosClient.post('/user/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      })

      // Sikeres regisztráció esetén átirányítunk a bejelentkezési oldalra
      router.push('/login')
    } catch (error: any) {
      // Hiba kezelése
      if (error.response?.data?.errors) {
        // Mezőnkénti validációs hibák
        const errors = error.response.data.errors
        if (Array.isArray(errors)) {
          const errorObj: Record<string, string> = {}
          errors.forEach((err: any) => {
            if (typeof err === 'object' && err.field) {
              errorObj[err.field] = err.message
            }
          })
          setValidationErrors(errorObj)
        } else {
          setError(error.response.data.message || 'Hiba történt a regisztráció során')
        }
      } else {
        setError(
          error.response?.data?.message || error.message || 'Hiba történt a regisztráció során'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
          <button onClick={clearError} className="float-right" aria-label="Hibaüzenet bezárása">
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
          className={`input input-bordered w-full ${
            validationErrors.username ? 'input-error' : ''
          }`}
          placeholder="your_username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        {validationErrors.username && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.username}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          className={`input input-bordered w-full ${validationErrors.email ? 'input-error' : ''}`}
          placeholder="name@company.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
        )}
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
          placeholder="••••••••"
          className={`input input-bordered w-full ${
            validationErrors.password ? 'input-error' : ''
          }`}
          value={formData.password}
          onChange={handleChange}
          required
        />
        {validationErrors.password && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="passwordConfirm"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Confirm Password
        </label>
        <input
          type="password"
          name="confirmPassword"
          id="passwordConfirm"
          placeholder="••••••••"
          className={`input input-bordered w-full ${
            validationErrors.confirmPassword ? 'input-error' : ''
          }`}
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        {validationErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? 'Regisztráció...' : 'Regisztráció'}
      </button>
    </form>
  )
}
