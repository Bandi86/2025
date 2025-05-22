import StatCards from '@/components/admin/stat/StatCards'
import StatTrends from '@/components/admin/stat/StatTrends'
import StatTopLists from '@/components/admin/stat/StatTopLists'
import { fetchAdminPosts } from '@/lib/api/posts'
import { fetchAdminUsers } from '@/lib/api/users'

export default async function AdminStatisztikaPage() {
  // Szerver oldali adatlekérés
  const postsData = await fetchAdminPosts({ limit: 1000, sortBy: 'createdAt_desc' })
  const usersData = await fetchAdminUsers({ limit: 1000, sortBy: 'createdAt_desc' })

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Statisztika</h1>
      <StatCards />
      <StatTrends posts={postsData.posts} users={usersData.users} />
      <StatTopLists />
    </main>
  )
}
