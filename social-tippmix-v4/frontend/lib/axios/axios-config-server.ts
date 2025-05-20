'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

const axiosServer = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

axiosServer.interceptors.request.use(async (config) => {
  const cookieStore = await cookies()
  // Use the correct cookie name for JWT
  const token = cookieStore.get('session_token')?.value
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

export default axiosServer

// hasznalat const response = await axiosServer.get('/protected-data')
