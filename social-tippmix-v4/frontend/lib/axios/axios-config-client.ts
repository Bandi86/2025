import axios from 'axios'

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Ha akarsz token-t localStorage-ből például:
axiosClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  return config
})

export default axiosClient

{/* hasznalat:
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
  */}
