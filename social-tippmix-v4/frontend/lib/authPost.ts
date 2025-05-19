import { User } from '../types/user'
import axiosServer from './axios/axios-config-server'

export async function register(username: string, email: string, password: string) {
  const res = await axiosServer.post('/user/register', {
    username,
    email,
    password
  })
  if (res.status !== 200) {
    throw new Error('Hiba a regisztráció során')
  }
  return res.data as User
}

export async function login(username: string, password: string) {
  const res = await axiosServer.post('/user/login', {
    username,
    password
  })
  if (res.status !== 200) {
    throw new Error('Hiba a bejelentkezés során')
  }
  return res.data as User
}
