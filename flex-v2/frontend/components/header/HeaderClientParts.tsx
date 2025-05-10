'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { User, useUser } from '@/app/UserContext';
import SearchBar from './SearchBar';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

type MenuItem = {
  name: string;
  path: string;
  icon?: string;
  onClick?: () => void;
};

interface HeaderClientPartsProps {
  mobileMenuItems: MenuItem[];
  desktopMenuItems: MenuItem[];
}

const HeaderClientParts = ({ mobileMenuItems, desktopMenuItems }: HeaderClientPartsProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Kliens oldali UserContext használata - minden felhasználói adat és
  // szkennelt könyvtár szám innen jön, már nem a szervertől kapjuk
  const { user, scannedDirsCount, logout } = useUser();

  // Kijelentkezési handler
  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Hiba a kijelentkezéskor:', error);
    }
  };

  // Dinamikus linkek frissítése a kijelentkezési funkcióval
  const updatedMobileItems = mobileMenuItems.map((item) =>
    item.name === 'Kijelentkezés' ? { ...item, onClick: handleLogout } : item
  );

  const updatedDesktopItems = desktopMenuItems.map((item) =>
    item.name === 'Kijelentkezés' ? { ...item, onClick: handleLogout } : item
  );

  // Első betű kinyerése a felhasználónévből avatárhoz
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : '';

  // Ikonok renderelése
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        );
      case 'login':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'user-plus':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        );
      case 'user':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'folder':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        );
      case 'settings':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'logout':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'film':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 0h2v4h-2V5zM7 11h6v4H7v-4zm8 0h2v4h-2v-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'tv':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v10a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 14.5v-10z" />
            <path
              d="M5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
              fillOpacity="0.5"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobil menü gomb */}
      <div className="flex-none sm:hidden">
        <button
          className="btn btn-ghost btn-circle text-white hover:bg-blue-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menü"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-6 h-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>

      {/* Logo */}
      <div className="flex-1">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-200 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
          </svg>
          <span>FlexMedia</span>
        </Link>
      </div>

      {/* Asztali keresősáv */}
      {user && scannedDirsCount > 0 && (
        <div className="hidden sm:block flex-1 mx-4 max-w-xl">
          <SearchBar isMobile={false} />
        </div>
      )}

      {/* Asztali menü */}
      <div className="hidden sm:flex items-center gap-1">
        {user && (
          <div className="flex items-center mr-2">
            <div className="avatar placeholder mr-2">
              <div className="bg-blue-300 text-white rounded-full w-8 h-8 flex items-center justify-center">
                <span>{userInitial}</span>
              </div>
            </div>
            <span className="font-medium text-sm hidden md:inline-block">{user.username}</span>
          </div>
        )}

        {updatedDesktopItems.map((item, index) => {
          const isActive = pathname === item.path;
          const baseClasses = 'flex items-center px-3 py-2 rounded-lg transition-all duration-200';
          const activeClasses = isActive
            ? 'bg-blue-600 text-white'
            : 'hover:bg-blue-800 text-white/90 hover:text-white';

          return (
            <li key={index} className="list-none">
              {item.onClick ? (
                <button onClick={item.onClick} className={`${baseClasses} ${activeClasses}`}>
                  {item.icon && renderIcon(item.icon)}
                  <span>{item.name}</span>
                </button>
              ) : (
                <Link href={item.path} className={`${baseClasses} ${activeClasses}`}>
                  {item.icon && renderIcon(item.icon)}
                  <span>{item.name}</span>
                </Link>
              )}
            </li>
          );
        })}
      </div>

      {/* Mobil menü (csak ha nyitva van) */}
      {isMobileMenuOpen && (
        <div className="fixed top-[60px] left-0 w-full bg-gradient-to-b from-blue-800 to-blue-900 shadow-lg z-50 sm:hidden animate-slideDown">
          <ul className="p-3 divide-y divide-blue-700/30">
            {user && (
              <li className="py-3 flex items-center">
                <div className="avatar placeholder mr-3">
                  <div className="bg-blue-300 text-white rounded-full w-8 h-8 flex items-center justify-center">
                    <span>{userInitial}</span>
                  </div>
                </div>
                <span className="font-medium text-white">{user.username}</span>
              </li>
            )}

            {updatedMobileItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <li key={index} className={`py-2 ${isActive ? 'bg-blue-700/30' : ''}`}>
                  {item.onClick ? (
                    <button
                      onClick={() => {
                        item.onClick && item.onClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full py-2 px-3 text-white/90 hover:text-white"
                    >
                      {item.icon && renderIcon(item.icon)}
                      <span>{item.name}</span>
                    </button>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center w-full py-2 px-3 text-white/90 hover:text-white"
                    >
                      {item.icon && renderIcon(item.icon)}
                      <span>{item.name}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};

export default HeaderClientParts;
