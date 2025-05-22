'use client'
import { Chart } from 'react-chartjs-2'
import 'chart.js/auto'

function getLast30DaysLabels() {
  const arr = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    arr.push(d.toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' }))
  }
  return arr
}

export default function StatTrends({ posts, users }: { posts: any[]; users: any[] }) {
  const labels = getLast30DaysLabels()
  const postCounts = labels.map(
    (label) =>
      posts.filter(
        (p) =>
          new Date(p.createdAt).toLocaleDateString('hu-HU', {
            month: '2-digit',
            day: '2-digit'
          }) === label
      ).length
  )
  const userCounts = labels.map(
    (label) =>
      users.filter(
        (u) =>
          new Date(u.createdAt).toLocaleDateString('hu-HU', {
            month: '2-digit',
            day: '2-digit'
          }) === label
      ).length
  )

  const data = {
    labels,
    datasets: [
      {
        label: 'Új posztok',
        data: postCounts,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.2)',
        tension: 0.3
      },
      {
        label: 'Új regisztrációk',
        data: userCounts,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.2)',
        tension: 0.3
      }
    ]
  }

  return (
    <div className="card bg-base-100 shadow p-4 mb-8">
      <h3 className="font-semibold text-lg mb-2">Napi aktivitás (utolsó 30 nap)</h3>
      <div className="w-full overflow-x-auto">
        <Chart type="line" data={data} height={220} />
      </div>
    </div>
  )
}
