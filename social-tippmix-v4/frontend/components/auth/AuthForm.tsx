import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/context/UserContext'
import { register, login } from '@/lib/authPost'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export default function Authform({mode }: AuthFormProps) {
  const router = useRouter();
  const context = useUser();
  if (!context) return null;
  const { error, setError } = context;
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (error) setErrorMessage(error);
    else setErrorMessage(null);
    setForm((f) => ({
      ...f,
      email: mode === 'register' ? f.email : ''
    }))
  }, [mode, error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'login') {
        await login(form.username, form.password)
        router.push('/')
      } else {
        await register(form.username, form.email, form.password)
        await login(form.username, form.password)
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'Hiba')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto mt-8">
      <input
        type="text"
        name="username"
        placeholder="Felhasználónév"
        className="input input-bordered"
        value={form.username}
        onChange={handleChange}
        required
      />
      {mode === 'register' && (
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="input input-bordered"
          value={form.email}
          onChange={handleChange}
          required
        />
      )}
      <input
        type="password"
        name="password"
        placeholder="Jelszó"
        className="input input-bordered"
        value={form.password}
        onChange={handleChange}
        required
      />
      {errorMessage && (
        <div className="alert alert-error text-sm">{errorMessage}</div>
      )}
      <button type="submit" className="btn btn-primary w-full">
        {mode === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
      </button>
    </form>
  )
}

export function AuthForm() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') as 'login' | 'register';
  return <Authform mode={mode} />
}
