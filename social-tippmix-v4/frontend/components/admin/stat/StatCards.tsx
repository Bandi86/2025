// Statisztikai kártyák (összes poszt, felhasználó, komment, like, tag)
import { fetchAggregatedStats } from '@/lib/stats/statsService'

export default async function StatCards() {
  // Szerver oldali statisztika lekérés (aggregált endpoint)
  const data = await fetchAggregatedStats()
  const { totalPosts = 0, totalUsers = 0, totalComments = 0, totalLikes = 0, totalTags = 0 } = data || {}

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div
        className="card bg-base-100 shadow p-4 flex flex-col items-center tooltip"
        data-tip="Az összes, rendszerben lévő poszt száma."
      >
        <div className="stat-figure text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <span className="text-3xl font-bold text-primary">{totalPosts}</span>
        <span className="text-base-content/70 text-sm mt-1">Posztok</span>
      </div>

      <div
        className="card bg-base-100 shadow p-4 flex flex-col items-center tooltip"
        data-tip="Az összes regisztrált felhasználó száma."
      >
        <div className="stat-figure text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <span className="text-3xl font-bold text-secondary">{totalUsers}</span>
        <span className="text-base-content/70 text-sm mt-1">Felhasználók</span>
      </div>

      <div
        className="card bg-base-100 shadow p-4 flex flex-col items-center tooltip"
        data-tip="Az összes, rendszerben lévő komment száma."
      >
        <div className="stat-figure text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </div>
        <span className="text-3xl font-bold text-accent">{totalComments}</span>
        <span className="text-base-content/70 text-sm mt-1">Kommentek</span>
      </div>

      <div
        className="card bg-base-100 shadow p-4 flex flex-col items-center tooltip"
        data-tip="Az összes, rendszerben lévő like száma."
      >
        <div className="stat-figure text-info">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
          </svg>
        </div>
        <span className="text-3xl font-bold text-info">{totalLikes}</span>
        <span className="text-base-content/70 text-sm mt-1">Like-ok</span>
      </div>

      <div
        className="card bg-base-100 shadow p-4 flex flex-col items-center tooltip"
        data-tip="Az összes, rendszerben lévő tag száma."
      >
        <div className="stat-figure text-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
        </div>
        <span className="text-3xl font-bold text-success">{totalTags}</span>
        <span className="text-base-content/70 text-sm mt-1">Tagek</span>
      </div>
    </div>
  )
}

