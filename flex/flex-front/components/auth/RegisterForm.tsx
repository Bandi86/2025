import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const RegisterForm = () => {

  const router = useRouter()

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (form.password !== form.confirmPassword) {
      setError('A jelszavak nem egyeznek!')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password
        })
      })
      const data = await res.json()
      console.log(data)
      if (!res.ok) throw new Error(data.error || 'Ismeretlen hiba')
      setSuccess('Sikeres regisztráció! Most már bejelentkezhetsz.')
      setForm({ username: '', email: '', password: '', confirmPassword: '' })
      setTimeout(() => {
        router.push('/auth/?login')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-base-100 p-8 rounded-xl shadow-lg flex flex-col gap-4 mt-8"
    >
      <h2 className="text-2xl font-bold mb-2 text-center">Regisztráció</h2>
      <label className="label"></label>
      <span className="label-text">Felhasználónév</span>
      <input
        type="text"
        name="username"
        placeholder="Felhasználónév"
        className="input input-bordered w-full"
        value={form.username}
        onChange={handleChange}
        required
        minLength={3}
      />
      <label className="label"></label>
      <span className="label-text">Email</span>
      <input
        type="email"
        name="email"
        placeholder="Email"
        className="input input-bordered w-full"
        value={form.email}
        onChange={handleChange}
        required
      />
      <label className="label"></label>
      <span className="label-text">Jelszó</span>
      <input
        type="password"
        name="password"
        placeholder="Jelszó"
        className="input input-bordered w-full"
        value={form.password}
        onChange={handleChange}
        required
        minLength={6}
      />
      <label className="label"></label>
      <span className="label-text">Jelszó megerősítése</span>
      <input
        type="password"
        name="confirmPassword"
        placeholder="Jelszó megerősítése"
        className="input input-bordered w-full"
        value={form.confirmPassword}
        onChange={handleChange}
        required
        minLength={8}
      />
      {error && <div className="alert alert-error text-sm">{error}</div>}
      {success && <div className="alert alert-success text-sm">{success}</div>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? 'Regisztráció...' : 'Regisztráció'}
      </button>
      <div className="text-center text-sm mt-2">
        Már van fiókod?{' '}
        <Link href="/auth/?login" className="link link-primary">
          Jelentkezz be!
        </Link>
      </div>
    </form>
  )
}

export default RegisterForm
