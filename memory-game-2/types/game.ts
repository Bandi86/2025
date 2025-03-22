export type GameDifficulty = 'easy' | 'medium' | 'hard'

export interface Card {
  id: number
  image: string
  isFlipped: boolean
  isMatched: boolean
}

export interface DifficultySettings {
  [key: string]: {
    pairs: number
    timeBonus: number
  }
}