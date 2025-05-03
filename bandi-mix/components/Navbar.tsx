'use client';
import Link from 'next/link';
import AuthModal from './AuthModal';
import React, { useState } from 'react';
import LogoutButton from './LogoutButton';
import { useAuth } from './AuthContext';

export default function Navbar() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <>
      <div className="navbar bg-base-200 shadow-md px-4">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-2xl font-extrabold">
            <span className="text-primary">bandi</span>
            <span className="text-accent">mix</span>
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 text-base font-semibold">
            <li>
              <Link href="/">Kezdőlap</Link>
            </li>
            <li>
              <Link href="/free">Ingyenes Tippek</Link>
            </li>
            <li>
              <Link href="/premium">Premium tippek</Link>
            </li>
            <li>
              <Link href="/subscribe">Előfizetés</Link>
            </li>
            <li>
              <Link href="/stats">Statisztika</Link>
            </li>
          </ul>
        </div>
        <div className="navbar-end gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm">🌑</span>
            <input
              type="radio"
              name="theme"
              value="dim"
              className="theme-controller radio"
              aria-label="Dim mode"
              defaultChecked
            />
            <span className="text-sm">🌞</span>
            <input
              type="radio"
              name="theme"
              value="winter"
              className="theme-controller radio"
              aria-label="Winter (light) mode"
            />
          </label>
          {isLoggedIn && user ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={user.avatar || 'https://picsum.photos/200/200'} alt="avatar" />
                </div>
              </label>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52"
              >
                <li className="font-bold text-base-content/80 text-center pb-2 border-b">
                  {user.username}
                </li>
                <li>
                  <Link href="/profile">Profilom</Link>
                </li>
                <li>
                  <Link href="/settings">Beállítások</Link>
                </li>
                <li>
                  <LogoutButton />
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                className="btn btn-outline btn-primary btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  setAuthTab('register');
                  setAuthOpen(true);
                }}
              >
                Regisztráció
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  setAuthTab('login');
                  setAuthOpen(true);
                }}
              >
                Belépés
              </button>
            </div>
          )}
        </div>
      </div>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        tab={authTab}
        setTab={setAuthTab}
        onLoginSuccess={() => setAuthOpen(false)}
      />
    </>
  );
}
