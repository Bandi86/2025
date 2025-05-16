import Link from 'next/link'
import React from 'react'

const AdminPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Admin Kezdőlap
      </h1>
      <div className="bg-white p-6 shadow rounded-lg">
        <p className="text-gray-700">
          Üdvözöllek az admin felületen! Itt kezelheted a felhasználókat,
          tartalmakat és egyéb beállításokat.
        </p>
        {/* Ide jöhetnek majd a különböző admin home komponensek mint például az utolsó 5 regisztráló, utolsó 5 poszt, utolsó 5 komment stb. */}
        <Link href="/admin/posts">
          <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Új poszt létrehozása
          </button>
        </Link>
      </div>
    </div>
  )
}

export default AdminPage
