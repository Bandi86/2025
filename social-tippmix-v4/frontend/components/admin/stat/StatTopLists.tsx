import { fetchAggregatedStats } from '@/lib/stats/statsService'

export default async function StatTopLists() {
  // Backend aggregált statisztika lekérés
  const { topUsers, topPosts, topCommentPosts } = await fetchAggregatedStats()

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card bg-base-100 shadow p-4">
        <h4 className="font-semibold mb-2">Legaktívabb felhasználók</h4>
        <ul className="list-disc ml-4">
          {topUsers.length === 0 ? (
            <li className="text-base-content/60">Nincs adat</li>
          ) : (
            topUsers.map((u: any) => (
              <li key={u.id}>
                <span className="font-bold">{u.displayName}</span> – {u.postCount} poszt
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="card bg-base-100 shadow p-4">
        <h4 className="font-semibold mb-2">Legnépszerűbb posztok</h4>
        <ul className="list-decimal ml-4">
          {topPosts.length === 0 ? (
            <li className="text-base-content/60">Nincs adat</li>
          ) : (
            topPosts.map((p: any) => (
              <li key={p.id}>
                <span className="font-bold">{p.title || 'Cím nélkül'}</span> – {p.likeCount} like
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="card bg-base-100 shadow p-4">
        <h4 className="font-semibold mb-2">Legtöbb kommentes posztok</h4>
        <ul className="list-decimal ml-4">
          {topCommentPosts.length === 0 ? (
            <li className="text-base-content/60">Nincs adat</li>
          ) : (
            topCommentPosts.map((p: any) => (
              <li key={p.id}>
                <span className="font-bold">{p.title || 'Cím nélkül'}</span> – {p.commentCount}{' '}
                hozzászólás
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
