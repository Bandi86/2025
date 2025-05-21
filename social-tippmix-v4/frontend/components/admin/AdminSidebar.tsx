import Link from 'next/link'

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

const CogIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15.036-6.372A7.5 7.5 0 0012 6v0m0 12v0a7.5 7.5 0 00-7.5-7.5M12 6A7.5 7.5 0 0119.5 13.5m-15.036-6.372A7.5 7.5 0 0112 6m0 12A7.5 7.5 0 004.5 13.5m15.036 6.372A7.5 7.5 0 0112 18m0-12A7.5 7.5 0 0119.5 6M12 18a7.5 7.5 0 007.5-7.5m-15 0a7.5 7.5 0 007.5 7.5m7.5-7.5a7.5 7.5 0 01-7.5 7.5M12 10.5v3m0 0v3m0-3h3m-3 0h-3"
    />
  </svg>
)

export default function AdminSidebar() {
  return (
    <aside className="bg-slate-800 text-slate-100 w-64 min-h-screen p-4 fixed left-0 top-16 shadow-lg">
      <nav>
        <ul className="space-y-2">
          <li>
            <Link
              href="/admin"
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors duration-150"
            >
              <HomeIcon className="w-6 h-6" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/users"
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors duration-150"
            >
              <UsersIcon className="w-6 h-6" />
              <span>Manage Users</span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/posts"
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5h18M3 12h18m-7.5 4.5h7.5M3 17.25h7.5m-7.5 0a2.25 2.25 0 100 4.5h7.5a2.25 2.25 0 100-4.5H3zM3 17.25V21m18-3.75V21m0-3.75a2.25 2.25 0 100-4.5H13.5a2.25 2.25 0 100 4.5h7.5zM21 17.25V21m0-3.75a2.25 2.25 0 100-4.5H13.5a2.25 2.25 0 100 4.5h7.5zM21 17.25V21"
                />
              </svg>
              <span>Manage Posts</span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/comments"
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5h18M3 12h18m-7.5 4.5h7.5M3 17.25h7.5m-7.5 0a2.25 2.25 0 100 4.5h7.5a2.25 2.25 0 100-4.5H3zM3 17.25V21m18-3.75V21m0-3.75a2.25 2.25 0 100-4.5H13.5a2.25 2.25 0 100 4.5h7.5zM21 17.25V21m0-3.75a2.25 2.25 0 100-4.5H13.5a2.25 2.25 0 100 4.5h7.5zM21 17.25V21"
                />
              </svg>
              <span>Manage Comments</span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/settings"
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-700 hover:text-white transition-colors duration-150"
            >
              <CogIcon className="w-6 h-6" />
              <span>Settings</span>
            </Link>
          </li>
          {/* Add more admin navigation links here with their respective icons */}
        </ul>
      </nav>
    </aside>
  )
}
