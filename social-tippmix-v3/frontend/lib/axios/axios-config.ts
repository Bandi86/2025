'use server'
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { cookies, headers } from 'next/headers'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// Interceptorok hozzáadása (opcionális)
axiosInstance.interceptors.request.use(
  async (config) => {
    // Itt hozzáadhatsz például authentikációs tokent minden kéréshez a http fejlécben
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    config.withCredentials = true
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Itt kezelheted a globális hibákat
    // Például: 401 Unauthenticated -> redirect to login
    if (error.response && error.response.status === 401) {
      // Redirect to login page or show a message
      console.error('Unauthorized access - redirecting to login')
    } else {
      console.error('API call failed:', error)
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
