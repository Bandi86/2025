import { User } from '@/app/UserContext'; // Feltételezve, hogy a User típus továbbra is releváns


export const handleLogout = async () => {
  try {
    // TODO: Implement actual logout logic here (e.g., API call to clear session)
    console.log('Kijelentkezés folyamatban...'); // Placeholder

    // Client-side redirect after logout logic
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Kijelentkezési hiba a handleLogout-ban:', error);
  }
};

export const headerItems = ({ user }: { user: User | null }) => {
  const mobileMenuItems = [
    { href: '/', label: 'Főoldal' },
    { href: '/filmek', label: 'Filmek' },
    { href: '/sorozatok', label: 'Sorozatok' },
    ...(user
      ? [
          { href: '/beallitasok', label: 'Beállítások' },
          // A "Profilom" linket a HeaderClientParts kezeli, mivel ott van a user.username
        ]
      : []),
  ];

  const desktopMenuItems = [
    { href: '/', label: 'Főoldal' },
    { href: '/filmek', label: 'Filmek' },
    { href: '/sorozatok', label: 'Sorozatok' },
    ...(user ? [{ href: '/beallitasok', label: 'Beállítások' }] : []),
  ];
  return { mobileMenuItems, desktopMenuItems };
};
