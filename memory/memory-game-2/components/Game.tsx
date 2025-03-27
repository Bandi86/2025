import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { GameStats } from '@/types/user'
import { GameDifficulty, Card } from '@/types/game'

import {
  difficultySettings,
  initializeCards,
} from '@/utils/gameUtils'
import { generateUniqueImages, GeneratedImage } from '@/utils/imageGenerator'
import router from 'next/router'

interface GameProps {
  difficulty?: GameDifficulty
  onGameComplete?: (stats: GameStats) => void
}

const Game: React.FC<GameProps> = ({
  difficulty = 'easy',
  onGameComplete,
}) => {
  const [cards, setCards] = useState<Card[]>([])
  const [isGameActive, setIsGameActive] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const initializeGame = async () => {
    setIsLoading(true)
    try {
      const numPairs = difficultySettings[difficulty].pairs
      const images = await generateUniqueImages(numPairs, 200, 'robohash')
      
      // Create pairs of cards
      const cardPairs = [...images, ...images].map((img, index) => ({
        id: index,
        image: img.url,
        imageId: img.id,
        isFlipped: false,
        isMatched: false,
      }))

      // Shuffle cards
      const shuffledCards = cardPairs.sort(() => Math.random() - 0.5)
      
      setCards(shuffledCards)
      setIsGameActive(true)
      setTimeElapsed(0)
      setMoves(0)
      setScore(0)
      setFlippedCards([])
    } catch (error) {
      console.error('Failed to initialize game:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initializeGame()
  }, [difficulty])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGameActive) {
      interval = setInterval(
        () => setTimeElapsed(prev => prev + 1),
        1000
      )
    }
    return () => clearInterval(interval)
  }, [isGameActive])

  const handleCardClick = (id: number) => {
    if (
      !isGameActive ||
      flippedCards.length === 2 ||
      flippedCards.includes(id) ||
      cards[id].isMatched
    )
      return

    const newFlipped = [...flippedCards, id]
    setFlippedCards(newFlipped)

    setCards(prev =>
      prev.map(card =>
        card.id === id ? { ...card, isFlipped: true } : card
      )
    )

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1)
      const [firstId, secondId] = newFlipped
      cards[firstId].image === cards[secondId].image
        ? handleMatch(firstId, secondId)
        : handleMismatch(newFlipped)
    }
  }

  const handleMatch = (firstId: number, secondId: number) => {
    setCards(prev =>
      prev.map(card =>
        card.id === firstId || card.id === secondId
          ? { ...card, isMatched: true }
          : card
      )
    )
    setFlippedCards([])

    const timeBonus = Math.max(
      0,
      difficultySettings[difficulty].timeBonus - timeElapsed
    )
    setScore(prev => prev + 100 + timeBonus)

    checkWinCondition()
  }

  const handleMismatch = (flippedCards: number[]) => {
    setTimeout(() => {
      setCards(prev =>
        prev.map(card =>
          flippedCards.includes(card.id)
            ? { ...card, isFlipped: false }
            : card
        )
      )
      setFlippedCards([])
    }, 1000)
  }

  const checkWinCondition = () => {
    if (cards.every(card => card.isMatched)) {
      setIsGameActive(false)
      onGameComplete?.({
        userId: 0,
        score,
        timeElapsed,
        difficulty,
        completed: true,
      })
    }
  }

  const handleExit = () => {
    const confirmExit = window.confirm(
      'Are you sure you want to exit the game?'
    )
    if (confirmExit) {
      router.push('/')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Memory Game</h2>
        <div className="flex justify-center gap-4">
          <div>Time: {timeElapsed}s</div>
          <div>Moves: {moves}</div>
          <div>Score: {score}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading game...</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-lg shadow-md transition-transform duration-500 transform 
                ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}
                ${isGameActive ? 'hover:scale-105' : 'cursor-not-allowed'}
              `}
              disabled={!isGameActive}
            >
              <div className="relative w-full h-full">
                <div
                  className={`absolute w-full h-full backface-hidden
                    ${card.isFlipped || card.isMatched ? 'hidden' : 'flex items-center justify-center'}
                  `}
                >
                  ?
                </div>
                <div
                  className={`absolute w-full h-full backface-hidden
                    ${card.isFlipped || card.isMatched ? 'flex items-center justify-center' : 'hidden'}
                  `}
                >
                  <Image
                    src={card.image}
                    alt="Card"
                    width={100}
                    height={100}
                    className="object-contain"
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isGameActive && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={initializeGame}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Play Again'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Game

