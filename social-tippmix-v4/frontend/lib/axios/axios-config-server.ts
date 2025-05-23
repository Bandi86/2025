'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

const axiosServer = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookie handling with the backend
})

axiosServer.interceptors.request.use(async (config) => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  } catch (error) {
    console.error('Error in axios server interceptor:', error)
    return config
  }
})

export default axiosServer
