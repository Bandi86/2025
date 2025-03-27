import { Card, GameDifficulty, DifficultySettings } from '@/types/game'

export const difficultySettings: DifficultySettings = {
  easy: { pairs: 6, timeBonus: 100 },
  medium: { pairs: 8, timeBonus: 150 },
  hard: { pairs: 12, timeBonus: 200 },
}

export const cardImages = [
  'globe.svg', 'vercel.svg', 'window.svg', 'file.svg',
  'star.svg', 'heart.svg', 'cloud.svg', 'moon.svg',
  'sun.svg', 'tree.svg', 'bird.svg', 'fish.svg',
]

export const initializeCards = (difficulty: GameDifficulty): Card[] => {
  const numPairs = difficultySettings[difficulty].pairs
  const selectedImages = cardImages.slice(0, numPairs)
  
  return [...selectedImages, ...selectedImages]
    .map((img, index) => ({
      id: index,
      image: img,
      isFlipped: false,
      isMatched: false,
    }))
    .sort(() => Math.random() - 0.5)
}