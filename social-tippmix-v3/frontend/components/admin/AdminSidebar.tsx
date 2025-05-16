'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Squares2X2Icon,
  UserGroupIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  NewspaperIcon, // Új ikon
  ChatBubbleLeftEllipsisIcon, // Új ikon
  ArchiveBoxIcon, // Új ikon
  ChartBarIcon, // Új ikon
  ClipboardDocumentListIcon, // Új ikon
  BellIcon, // Új ikon
  EnvelopeIcon, // Új ikon
  FlagIcon // Új ikon
} from '@heroicons/react/24/outline'
import LogoutButton from '../auth/logout' // Kijelentkezés gomb

const menuItems = [
  { href: '/admin', label: 'Irányítópult', icon: Squares2X2Icon },
  { href: '/admin/users', label: 'Felhasználók', icon: UserGroupIcon },
  { href: '/admin/posts', label: 'Bejegyzések', icon: NewspaperIcon },
  {
    href: '/admin/comments',
    label: 'Hozzászólások',
    icon: ChatBubbleLeftEllipsisIcon
  },
  { href: '/admin/content', label: 'Tartalomkezelés', icon: ArchiveBoxIcon },
  { href: '/admin/analytics', label: 'Elemzések', icon: ChartBarIcon },
  { href: '/admin/logs', label: 'Naplók', icon: ClipboardDocumentListIcon },
  { href: '/admin/notifications', label: 'Értesítések', icon: BellIcon },
  { href: '/admin/messages', label: 'Üzenetek', icon: EnvelopeIcon },
  { href: '/admin/settings', label: 'Beállítások', icon: CogIcon },
  {
    href: '/admin/reports',
    label: 'Jelentések',
    icon: FlagIcon // Cserélve ArrowLeftOnRectangleIcon-ról
  }
]

const AdminSidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-800 text-white p-5 flex flex-col min-h-screen justify-between">
      <div>
        <div className="mb-10">
          <Link href="/admin" className="text-2xl font-semibold text-white hover:text-gray-300">
            Admin Panel
          </Link>
        </div>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 transition-colors duration-150 ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="mt-auto pt-5 border-t border-gray-700">
        <LogoutButton />
        {/* A LogoutButton most már itt van, és az eredeti stílusát fogja használni.
            Ha egyedi stílust szeretnél neki itt, akkor a LogoutButton komponenst kell módosítani
            vagy egy wrapper komponenst használni körülötte.
            Például, ha azt szeretnéd, hogy ikonja is legyen:
            <button
              onClick={() => signOut()} // signOut importálása next-auth/react-ből
              className="flex items-center space-x-3 p-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white w-full transition-colors duration-150"
            >
              <ArrowLeftOnRectangleIcon className="h-6 w-6" />
              <span>Kijelentkezés</span>
            </button>
        */}
        <p className="text-xs text-gray-500 text-center mt-4">
          © {new Date().getFullYear()} Social Tippmix
        </p>
      </div>
    </aside>
  )
}

export default AdminSidebar
