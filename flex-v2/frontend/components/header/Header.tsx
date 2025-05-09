import { headerItems } from '@/app/lib/headerHandling';
import { User } from '@/app/UserContext'
import HeaderClientParts from './HeaderClientParts'
import SearchBar from './SearchBar'

// Placeholder: Ezt a függvényt a projekt specifikus szerver oldali
// autentikációs logikájával kell helyettesíteni (pl. session cookie olvasása).
async function getServerSideUser(): Promise<User | null> {
  // console.log('Fetching user on server side...');
  // Példa:
  // const { getUser } = await import('@/app/lib/auth-server'); // Tegyük fel van ilyen
  // return await getUser();
  return null; // Alapértelmezett, ha nincs bejelentkezett felhasználó
}

// Placeholder: Ezt a függvényt a projekt specifikus szerver oldali
// adatlekérési logikájával kell helyettesíteni.
async function getScannedDirsCountServerSide(): Promise<number> {
  // console.log('Fetching scannedDirsCount on server side...');
  return 0; // Alapértelmezett érték
}

const Header = async () => {
  const user = await getServerSideUser();
  const scannedDirsCount = await getScannedDirsCountServerSide();

  const { mobileMenuItems, desktopMenuItems } = headerItems({ user });

  return (
    <div className="bg-base-100 shadow-lg sticky top-0 z-10 border-b border-base-300">
      <div className="navbar container mx-auto px-4">
        <HeaderClientParts
          user={user}
          scannedDirsCount={scannedDirsCount}
          mobileMenuItems={mobileMenuItems}
          desktopMenuItems={desktopMenuItems}
        />
      </div>

      {/* Mobil keresősáv */}
      {user && scannedDirsCount > 0 && (
        <div className="sm:hidden px-4 pb-3">
          <SearchBar isMobile={true} />
        </div>
      )}
    </div>
  );
};

export default Header;
