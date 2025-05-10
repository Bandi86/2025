'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '@/app/UserContext';

const LoginForm = () => {
  const router = useRouter();
  const { login } = useUser();

  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // UserContext login használata - ez most már cookie alapú tokent használ
      await login({
        username: form.username,
        password: form.password,
      });

      // Sikeres bejelentkezés után átirányítás
      router.push('/');
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data?.message ||
            err.response.data?.error ||
            'Érvénytelen felhasználónév vagy jelszó.'
        );
      } else {
        setError(err.message || 'Ismeretlen bejelentkezési hiba történt.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-base-100 p-8 rounded-xl shadow-lg flex flex-col gap-4 mt-8"
    >
      <h2 className="text-2xl font-bold mb-2 text-center">Bejelentkezés</h2>
      <label className="label">
        <span className="label-text">Felhasználónév vagy Email</span>
      </label>
      <input
        type="text"
        name="username"
        placeholder="Felhasználónév vagy Email"
        className="input input-bordered w-full"
        value={form.username}
        onChange={handleChange}
        required
      />
      <label className="label">
        <span className="label-text">Jelszó</span>
      </label>
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
        Nincs még fiókod?{' '}
        <Link href="/auth/?register" className="link link-primary">
          Regisztrálj!
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
