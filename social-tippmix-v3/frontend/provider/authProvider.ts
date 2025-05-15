import axios from 'axios'
import { User } from '../types/user'

const API_BASE = process.env.NEXT_PUBLIC_API_URL + '/user'

export async function register(name: string, email: string, password: string): Promise<User> {
  const res = await axios.post(`${API_BASE}/register`, { name, email, password })
  return res.data.user
}

export async function login(name: string, password: string): Promise<User> {
  const res = await axios.post(`${API_BASE}/login`, { name, password }, { withCredentials: true })
  return res.data.user
}

export async function logout(): Promise<void> {
  await axios.get(`${API_BASE}/`, { withCredentials: true })
}

export async function getMe(): Promise<User> {
  const res = await axios.get(`${API_BASE}/me`, { withCredentials: true })
  return res.data.user
}
