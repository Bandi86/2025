import axios, { AxiosError } from 'axios'
import { User } from '@/types/user'

type LoginData = {
  email: string
  password: string
}

type RegisterData = {
  name: string
  email: string
  password: string
}

export const login = async (data: LoginData) => {
  try {
    const response = await axios.post('/api/user/login', data, { 
      withCredentials: true 
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Login failed')
    }
    throw new Error('An unexpected error occurred')
  }
}

export const register = async (data: RegisterData) => {
  try {
    const response = await axios.post('/api/user/register', data)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || 'Registration failed')
    }
    throw new Error('An unexpected error occurred')
  }
}

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required'
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Email is invalid'
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  return null
}

export const validateConfirmPassword = (
  password: string, 
  confirmPassword: string
): string | null => {
  if (password !== confirmPassword) return 'Passwords do not match'
  return null
}
