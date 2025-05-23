import Link from 'next/link'
import { fetchPosts } from '@/lib/posts/postsService'
import { fetchAdminUsers } from '@/lib/users/usersService'

function daysAgo(date: string, days: number) {
  const d = new Date(date)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= days
}

export default async function AdminDashboardPanel() {
  // Összes poszt (limit: 1, de a totalPosts mező a teljes számot adja vissza)
  const postsData = await fetchPosts({ limit: 1 })
  let totalPosts =
    typeof postsData.totalPosts === 'number' && postsData.totalPosts > 0
      ? postsData.totalPosts
      : Array.isArray(postsData.posts) && postsData.posts.length > 0
      ? postsData.posts.length
      : 0

  // Összes felhasználó
  const usersData = await fetchAdminUsers({ limit: 1 })
  const totalUsers = usersData.totalUsers

  // Legutóbbi 3 poszt
  const recentPostsData = await fetchPosts({ limit: 3, sortBy: 'createdAt' })
  const recentPosts: any[] = recentPostsData.posts

  // Új posztok (7 nap)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const newPosts7d = recentPosts.filter((p: any) => new Date(p.createdAt) > weekAgo).length

  // Függőben lévő posztok (ha van ilyen státusz)
  let pendingPosts = 0
  try {
    // Add explicit logging for this potential authentication issue
    console.log('Fetching pending posts for admin dashboard...')
    const pending = await fetchPosts({
      statusFilter: 'pending',
      limit: 1
    })
    console.log('Successfully fetched pending posts')
    pendingPosts = pending.totalPosts || 0
  } catch (error: any) {
    console.error('Error fetching pending posts:', error)
    if (error.response?.status === 401) {
      console.error('Authentication error when fetching pending posts - JWT token may be invalid')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Statisztikai kártyák */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow-md p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-primary">{totalPosts}</span>
          <span className="text-base-content/70 text-sm mt-1">Összes poszt</span>
        </div>
        <div className="card bg-base-100 shadow-md p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-primary">{totalUsers}</span>
          <span className="text-base-content/70 text-sm mt-1">Összes felhasználó</span>
        </div>
        <div className="card bg-base-100 shadow-md p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-primary">{newPosts7d}</span>
          <span className="text-base-content/70 text-sm mt-1">Új posztok (7 nap)</span>
        </div>
        <div className="card bg-base-100 shadow-md p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-primary">{pendingPosts}</span>
          <span className="text-base-content/70 text-sm mt-1">Függőben lévő posztok</span>
        </div>
      </div>

      {/* Gyors műveletek */}
      <div className="card bg-base-100 shadow-xl p-6 flex flex-col gap-4">
        <h2 className="card-title text-xl">Admin műveletek</h2>
        <div className="flex flex-col gap-2">
          <Link href="/admin/posts/create-post">
            <button className="btn btn-primary w-full">Új poszt létrehozása</button>
          </Link>
          <Link href="/admin/users">
            <button className="btn btn-secondary w-full">Felhasználók kezelése</button>
          </Link>
        </div>
      </div>

      {/* Legutóbbi posztok */}
      <div className="card bg-base-100 shadow p-4">
        <h3 className="font-semibold text-lg mb-2">Legutóbbi posztok</h3>
        <ul className="divide-y divide-base-200">
          {recentPosts.map((post) => (
            <li key={post.id} className="py-2 flex items-center justify-between">
              <span className="truncate max-w-xs">{post.title}</span>
              <span className="text-xs text-base-content/60 ml-2">
                {post.createdAt?.slice(0, 10)}
              </span>
              <Link href={`/admin/posts/${post.id}`} className="btn btn-xs btn-ghost ml-2">
                Megnéz
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
