import formatDate from '@/helpers/formatDate'
import Image from 'next/image'
import Link from 'next/link'

const CurrentTipp = () => {
  const fakestats = [
    {
      date: new Date(),
      hazaicsapat: 'xy',
      vendegcsapat: 'yz',
      kimenetel: 'hazai',
      odds: 1.5
    },
    {
      date: new Date(),
      hazaicsapat: 'xy',
      vendegcsapat: 'yz',
      kimenetel: 'hazai',
      odds: 1.5
    },
    {
      date: new Date(),
      hazaicsapat: 'xy',
      vendegcsapat: 'yz',
      kimenetel: 'hazai',
      odds: 1.5
    },
    {
      date: new Date(),
      hazaicsapat: 'xy',
      vendegcsapat: 'yz',
      kimenetel: 'hazai',
      odds: 1.5
    },
    {
      date: new Date(),
      hazaicsapat: 'xy',
      vendegcsapat: 'yz',
      kimenetel: 'hazai',
      odds: 1.5
    }
  ]

  const fakestats2 = [
    {
      hatarido: new Date(Date.now() + 3600 * 1000), // 1 óra múlva
      tet: 10000,
      nyeremeny: 5000,
      odds: 2.5,
      kod: 'ABCD1234',
      kep: '/images/szelveny.png',
    }
  ]

  return (
    <div className="text-3xl font-bold">
      <div className="flex flex-col gap-4 mb-8">
        <span>{formatDate()}</span>
        <span>Ingyenes Tipp:</span>
        <p className="text-base font-normal">
          Minden délelőtt! 5 meccs 4/5 kombi 2000ft alaptéttel. Ha több többet szeretnél látni
          kattints
          <Link href={'/subscribe'}>
            <span className="underline bg-red-500 cursor-pointer hover:bg-red-700 transition-colors px-1 ml-1">
              ide!
            </span>
          </Link>
        </p>
      </div>
      <div className="overflow-x-auto mb-10">
        <table className="min-w-full text-base border border-gray-300 rounded-lg bg-white shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">Dátum</th>
              <th className="px-4 py-2 border-b">Csapat 1</th>
              <th className="px-4 py-2 border-b">Csapat 2</th>
              <th className="px-4 py-2 border-b">Kimenetel</th>
              <th className="px-4 py-2 border-b">Odds</th>
            </tr>
          </thead>
          <tbody>
            {fakestats.map((stat, idx) => (
              <tr key={'main-' + idx} className="even:bg-gray-50 hover:bg-yellow-100 transition-colors">
                <td className="px-4 py-2 border-b">{stat.date.toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-2 border-b">{stat.hazaicsapat}</td>
                <td className="px-4 py-2 border-b">{stat.vendegcsapat}</td>
                <td className="px-4 py-2 border-b capitalize">{stat.kimenetel}</td>
                <td className="px-4 py-2 border-b">{stat.odds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto mb-10">
        <table className="min-w-full text-base border border-gray-300 rounded-lg bg-white shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">Feladási határidő</th>
              <th className="px-4 py-2 border-b">Tét (Ft)</th>
              <th className="px-4 py-2 border-b">Nyeremény (Ft)</th>
              <th className="px-4 py-2 border-b">Odds</th>
              <th className="px-4 py-2 border-b">Kód</th>
            </tr>
          </thead>
          <tbody>
            {fakestats2.map((stat, idx) => (
              <tr key={'details2-' + idx} className="even:bg-gray-50 hover:bg-yellow-100 transition-colors">
                <td className="px-4 py-2 border-b">{stat.hatarido.toLocaleString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-2 border-b">{stat.tet}</td>
                <td className="px-4 py-2 border-b">{stat.nyeremeny}</td>
                <td className="px-4 py-2 border-b">{stat.odds}</td>
                <td className="px-4 py-2 border-b">{stat.kod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center mt-10">
        <span className="text-sm text-gray-500">Szelvény:</span>
        <Image
          src="/images/szelveny.png"
          alt="Szelvény kép"
          width={300}
          height={200}
          className="rounded-lg shadow-md"
        />
      </div>
    </div>
  )
}

export default CurrentTipp
