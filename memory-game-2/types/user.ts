export interface User {
  id?: number
  username: string
  email: string
  password: string
  createdAt?: string
  updatedAt?: string
  role: string
}

export interface Session {
  id: number
  userId: number
  token: string
  expiresAt: string
  createdAt: string
}

export interface GameStats {
  id?: number
  userId: number
  score: number
  timeElapsed: number
  difficulty: 'easy' | 'medium' | 'hard'
  completed: boolean
  createdAt?: string
}

export interface AuthUser {
  id: number
  username: string
  email: string
}
