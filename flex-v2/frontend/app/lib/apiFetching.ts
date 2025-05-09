import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import apiClient from './axiosInstance'

// API válasz struktúra
type ApiResponse<T = any> = {
  success: boolean
  data: T | null
  error: string | null
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Fő API kérés függvény generikus típussal és fejlettebb hibakezeléssel
export async function fetchData<T = any>(
  url: string,
  method: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient({
      url: `${apiUrl}/${url}`,
      method,
      data,
      ...config
    })
    return {
      success: true,
      data: response.data,
      error: null
    }
  } catch (error) {
    let message = 'Ismeretlen hiba'
    if (axios.isAxiosError(error)) {
      if (error.response) {
        message = error.response.data?.message || error.response.statusText
      } else if (error.request) {
        message = 'Nincs válasz a szervertől.'
      } else {
        message = error.message
      }
    } else if (error instanceof Error) {
      message = error.message
    }
    return {
      success: false,
      data: null,
      error: message
    }
  }
}

// Kényelmi segédfüggvények
export const fetchGet = <T = any>(url: string, config?: AxiosRequestConfig) =>
  fetchData<T>(url, 'GET', undefined, config)

export const fetchPost = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  fetchData<T>(url, 'POST', data, config)

export const fetchPut = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  fetchData<T>(url, 'PUT', data, config)

export const fetchDelete = <T = any>(url: string, config?: AxiosRequestConfig) =>
  fetchData<T>(url, 'DELETE', undefined, config)
