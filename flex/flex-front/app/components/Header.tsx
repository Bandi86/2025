import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import SearchBar from './SearchBar'

export default function Header() {
  return (
    <div className="bg-base-100 shadow-lg sticky top-0 z-10 border-b border-base-300">
      <div className="navbar container mx-auto px-4">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><Link href="/">Főoldal</Link></li>
              <li><Link href="/filmek">Filmek</Link></li>
              <li><Link href="/sorozatok">Sorozatok</Link></li>
              <li><Link href="/beallitasok">Beállítások</Link></li>
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost font-poppins text-xl normal-case">
            <span className="text-primary font-bold">Flex</span>
            <span className="font-medium">Media</span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal">
            <li><Link className="rounded-lg font-medium transition-colors hover:bg-base-200" href="/">Főoldal</Link></li>
            <li><Link className="rounded-lg font-medium transition-colors hover:bg-base-200" href="/filmek">Filmek</Link></li>
            <li><Link className="rounded-lg font-medium transition-colors hover:bg-base-200" href="/sorozatok">Sorozatok</Link></li>
            <li><Link className="rounded-lg font-medium transition-colors hover:bg-base-200" href="/beallitasok">Beállítások</Link></li>
          </ul>
        </div>

        <div className="navbar-end gap-3">
          <div className="hidden sm:block">
            <SearchBar />
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobil keresősáv */}
      <div className="sm:hidden px-4 pb-3">
        <SearchBar isMobile={true} />
      </div>
    </div>
  )
}
