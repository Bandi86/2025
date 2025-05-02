import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const LoginForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await login(form.email, form.password);
    setLoading(false);
    if (res.success) {
      setSuccess('Sikeres bejelentkezés!');
      setForm({ email: '', password: '' });
      onSuccess?.();
    } else {
      setError(res.error || 'Ismeretlen hiba történt.');
    }
  };

  return (
    <form
      className="card card-bordered max-w-sm mx-auto p-6 bg-base-100 shadow-xl"
      onSubmit={handleSubmit}
    >
      <h2 className="card-title mb-2 text-center">Belépés</h2>
      {error && (
        <div role="alert" className="alert alert-error mb-2">
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div role="alert" className="alert alert-success mb-2">
          <span>{success}</span>
        </div>
      )}
      <label className="input input-bordered flex items-center gap-2 mb-2">
        <span className="label-text w-24">Email</span>
        <input
          type="email"
          name="email"
          placeholder="email@example.com"
          className="grow input input-bordered"
          value={form.email}
          onChange={handleChange}
          required
        />
      </label>
      <label className="input input-bordered flex items-center gap-2 mb-2">
        <span className="label-text w-24">Jelszó</span>
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          className="grow input input-bordered"
          value={form.password}
          onChange={handleChange}
          required
        />
      </label>
      <button type="submit" className="btn btn-primary mt-2 w-full" disabled={loading}>
        {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Belépés'}
      </button>
      <div className="text-xs text-center mt-2">
        <a className="link link-primary" href="#">
          Elfelejtett jelszó?
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
