'use client';
import { headerItems } from '@/app/lib/headerHandling';
import HeaderClientParts from './HeaderClientParts';
import SearchBar from './SearchBar';

function getIconForMenuItem(label: string): string {
  switch (label) {
    case 'Kezdőlap':
      return 'home';
    case 'Bejelentkezés':
      return 'login';
    case 'Regisztráció':
      return 'user-plus';
    case 'Profil':
      return 'user';
    case 'Könyvtárak':
      return 'folder';
    case 'Beállítások':
      return 'settings';
    case 'Kijelentkezés':
      return 'logout';
    case 'Filmek':
      return 'film';
    case 'Sorozatok':
      return 'tv';
    default:
      return 'default-icon'; // Provide a default icon name if no match is found
  }
}

const Header = () => {
  const { mobileMenuItems, desktopMenuItems } = headerItems({ user: null });

  const transformedMobileMenuItems = mobileMenuItems.map((item) => ({
    name: item.label,
    path: item.href,
    icon: getIconForMenuItem(item.label),
  }));

  const transformedDesktopMenuItems = desktopMenuItems.map((item) => ({
    name: item.label,
    path: item.href,
    icon: getIconForMenuItem(item.label),
  }));

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 sticky top-0 z-40 shadow-md">
      <div className="container mx-auto flex items-center justify-between h-15 px-4">
        <HeaderClientParts
          mobileMenuItems={transformedMobileMenuItems}
          desktopMenuItems={transformedDesktopMenuItems}
        />
      </div>
    </header>
  );
};

export default Header;
