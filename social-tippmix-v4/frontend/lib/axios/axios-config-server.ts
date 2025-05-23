'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

// Create axios instance for server-side requests
const axiosServer = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookie handling with the backend
})

// Enhanced request interceptor for server-side authentication
axiosServer.interceptors.request.use(async (config) => {
  try {
    // Get cookies from Next.js server context
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (token) {
      // Set both methods for maximum compatibility
      // 1. Set Authorization header with Bearer token
      config.headers['Authorization'] = `Bearer ${token}`

      // 2. Set Cookie header explicitly
      const existingCookie = config.headers['Cookie'] || ''
      config.headers['Cookie'] = existingCookie
        ? `${existingCookie}; session_token=${token}`
        : `session_token=${token}`
    }

    // Always ensure withCredentials is set for CORS requests with cookies
    config.withCredentials = true

    return config
  } catch (error) {
    console.error('Error in axios server interceptor:', error)
    return config
  }
})

// Add response interceptor for better error handling
axiosServer.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Log detailed error information for server-side debugging
      console.error('API request failed:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      })
    } else if (error.request) {
      console.error('No response received:', error.request)
    } else {
      console.error('Request setup error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default axiosServer
