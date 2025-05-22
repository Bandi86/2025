// Statisztikai kártyák (összes poszt, felhasználó, komment, like)
import { fetchAggregatedStats } from '@/lib/api/stats'
// Kommentekhez és like-okhoz nincs globális API, így azokat nem jelenítjük meg

export default async function StatCards() {
  // Szerver oldali statisztika lekérés (aggregált endpoint)
  const { totalPosts = 0, totalUsers = 0 } = await fetchAggregatedStats()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div
        className="card bg-base-100 shadow-md p-4 flex flex-col items-center tooltip"
        data-tip="Az összes, rendszerben lévő poszt száma."
      >
        <span className="text-2xl font-bold text-primary">{totalPosts}</span>
        <span className="text-base-content/70 text-sm mt-1">Összes poszt</span>
      </div>
      <div
        className="card bg-base-100 shadow-md p-4 flex flex-col items-center tooltip"
        data-tip="Az összes regisztrált felhasználó száma."
      >
        <span className="text-2xl font-bold text-primary">{totalUsers}</span>
        <span className="text-base-content/70 text-sm mt-1">Összes felhasználó</span>
      </div>
      {/* TODO: Ha lesz globális komment/like stat API, ide lehet tenni */}
    </div>
  )
}
