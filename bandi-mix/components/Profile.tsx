import axios from 'axios'
import React, { useEffect, useState } from 'react'

async function ProfileRender() {
  useEffect(() => {}, [await axios('/api/public/profile')])

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-6 bg-white rounded-lg shadow-lg">
      <img
        src="https://placehold.co/200x200"
        alt="Profile Picture"
        className="w-32 h-32 rounded-full border-4 border-blue-500"
      />
      <div className="flex-1">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">John Doe</h2>
        <p className="text-xl text-gray-600 mb-4">
          Software Engineer | React Developer | Building awesome user experiences
        </p>
        <div className="flex gap-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">📧</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">💻</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">🌍</span>
        </div>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Edit Profile
        </button>
      </div>
    </div>
  )
}

export default ProfileRender
