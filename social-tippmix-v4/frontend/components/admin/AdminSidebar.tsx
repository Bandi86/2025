import Link from 'next/link'
import LogoutButton from '@/components/auth/LogoutButtonZustand'

const userId = '351b788c-d4b9-47ec-9644-582e187a1db9'

// Heroicon SVGs (React JSX format)
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M11.25 12.75V21m0-8.25V6M12.75 12.75V21m0-8.25V6"
    />
  </svg>
)
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
)
const PostIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 6v12a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V6m15 0A2.25 2.25 0 0017.25 3.75H6.75A2.25 2.25 0 004.5 6m15 0v.75A2.25 2.25 0 0117.25 9H6.75A2.25 2.25 0 014.5 6.75V6"
    />
  </svg>
)
const CommentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 21h9a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0016.5 4.5h-9A2.25 2.25 0 005.25 6.75v12A2.25 2.25 0 007.5 21z"
    />
  </svg>
)
const CategoryIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 7.5V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v1.5M3 7.5h18M3 7.5v9A2.25 2.25 0 005.25 18.75h13.5A2.25 2.25 0 0021 16.5v-9M3 7.5l9 6 9-6"
    />
  </svg>
)
const StatsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 17.25V21h3.75V17.25H3zm6.75-6V21h3.75V11.25h-3.75zm6.75 3V21h3.75V14.25h-3.75z"
    />
  </svg>
)
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3m-1.5 0v12m0 0h-3m3 0h3" />
  </svg>
)
const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
)
const LogoutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-6-3h12m0 0l-3-3m3 3l-3 3"
    />
  </svg>
)

export default function AdminSidebar() {
  return (
    <aside className="min-h-screen w-64 bg-slate-800 text-white p-0 shadow-lg border-r border-base-300 fixed left-0 top-0 z-30">
      <nav className="h-full flex flex-col">
        <ul className="menu menu-lg rounded-none pt-8 p-4 gap-2 flex-1">
          <li className="menu-title text-white font-bold">Általános</li>
          <li>
            <Link prefetch={false} href="/admin" className="flex items-center gap-3 font-bold">
              <HomeIcon className="w-6 h-6" />
              <span>Vezérlőpult</span>
            </Link>
          </li>
          <li>
            <Link
              prefetch={false}
              href="/admin/stats"
              className="flex items-center gap-3 font-bold"
            >
              <StatsIcon className="w-6 h-6" />
              <span>Statisztikák</span>
            </Link>
          </li>
          <li>
            <Link
              prefetch={false}
              href={`/profile?id=${userId}`}
              className="flex items-center gap-3 font-bold"
            >
              <ProfileIcon className="w-6 h-6" />
              <span>Saját profil</span>
            </Link>
          </li>

          <li className="menu-title text-white font-bold">Tartalom</li>
          <li>
            <Link
              prefetch={false}
              href="/admin/posts"
              className="flex items-center gap-3 font-bold"
            >
              <PostIcon className="w-6 h-6" />
              <span>Posztok</span>
            </Link>
          </li>
          <li>
            <Link
              prefetch={false}
              href="/admin/comments"
              className="flex items-center gap-3 font-bold"
            >
              <CommentIcon className="w-6 h-6" />
              <span>Hozzászólások</span>
            </Link>
          </li>
          <li>
            <Link
              prefetch={false}
              href="/admin/categories"
              className="flex items-center gap-3 font-bold"
            >
              <CategoryIcon className="w-6 h-6" />
              <span>Kategóriák</span>
            </Link>
          </li>
          <li>
            <Link
              prefetch={false}
              href="/admin/users"
              className="flex items-center gap-3 font-bold"
            >
              <UsersIcon className="w-6 h-6" />
              <span>Felhasználók</span>
            </Link>
          </li>

          <li className="menu-title text-white font-bold">Beállítások</li>
          <li>
            <Link
              prefetch={false}
              href="/admin/settings"
              className="flex items-center gap-3 font-bold"
            >
              <SettingsIcon className="w-6 h-6" />
              <span>Beállítások</span>
            </Link>
          </li>
          <li>
            {/* Kijelentkezés gomb */}
            <div className="flex items-center gap-3 font-bold">
              <LogoutIcon className="w-6 h-6" />
              <LogoutButton />
            </div>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
