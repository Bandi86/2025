'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '@/app/UserContext';
import apiClient from '@/app/lib/axiosInstance';

const RegisterForm = () => {
  const router = useRouter();
  const { setUser } = useUser();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError('A jelszavak nem egyeznek!');
      return;
    }

    setLoading(true);

    try {
      // A regisztrációs kérés küldése az API-nak
      const response = await apiClient.post('/api/user/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // Sikeres regisztráció esetén
      if (response.data && response.data.user) {
        // Beállítjuk a user adatait a kontextusban
        setUser(response.data.user);

        // Sikeres üzenet és form reset
        setSuccess('Sikeres regisztráció! Most már bejelentkezhetsz.');
        setForm({ username: '', email: '', password: '', confirmPassword: '' });

        // Rövid várakozás után átirányítás a főoldalra vagy login oldalra
        setTimeout(() => {
          router.push('/'); // vagy '/auth/?login' ha nem automatikus a bejelentkeztetés
        }, 2000);
      } else {
        throw new Error('Sikertelen regisztráció: érvénytelen válasz a szerverről.');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        // Próbáljuk meg a backend által küldött hibaüzenetet használni
        setError(
          err.response.data?.message ||
            err.response.data?.error ||
            'Ismeretlen regisztrációs hiba történt.'
        );
      } else {
        // Általános hibaüzenet, ha nem axios hiba vagy nincs response
        setError(err.message || 'Ismeretlen regisztrációs hiba történt.');
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
      <h2 className="text-2xl font-bold mb-2 text-center">Regisztráció</h2>
      <label className="label">
        <span className="label-text">Felhasználónév</span>
      </label>
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
      <label className="label">
        <span className="label-text">Email</span>
      </label>
      <input
        type="email"
        name="email"
        placeholder="Email"
        className="input input-bordered w-full"
        value={form.email}
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
        minLength={8}
      />
      <label className="label">
        <span className="label-text">Jelszó megerősítése</span>
      </label>
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
  );
};

export default RegisterForm;
