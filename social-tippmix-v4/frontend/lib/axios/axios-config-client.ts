import axios from 'axios'

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookie handling
})

// Remove token from localStorage - use HTTP-only cookies instead
// The backend should set session_token as HTTP-only cookie
axiosClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        // Store the current URL to redirect back after login
        const currentPath = window.location.pathname + window.location.search
        if (currentPath !== '/login') {
          window.location.href = `/login?redirect_to=${encodeURIComponent(currentPath)}`
        }
      }
    }
    return Promise.reject(error)
  }
)

export default axiosClient

{
  /* hasznalat:
import { useEffect } from 'react'
import axiosClient from '@/lib/axios/axios-client'

export default function MyComponent() {
  useEffect(() => {
    axiosClient.get('/public-data').then(res => {
      console.log(res.data)
    })
  }, [])

  return <div>Client oldal</div>
}
  */
}
