import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { GameStats } from '@/types/user'
import { GameDifficulty, Card } from '@/types/game'

import {
  difficultySettings,
  initializeCards,
} from '@/utils/gameUtils'

interface GameProps {
  difficulty?: GameDifficulty
  onGameComplete?: (stats: GameStats) => void
}

const Game = ({
  difficulty = 'medium',
  onGameComplete,
}: GameProps) => {
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>([])
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [moves, setMoves] = useState(0)
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [isGameActive, setIsGameActive] = useState(false)
  const [score, setScore] = useState(0)

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

  const initializeGame = () => {
    setCards(initializeCards(difficulty))
    setIsGameActive(true)
    setTimeElapsed(0)
    setMoves(0)
    setScore(0)
    setFlippedCards([])
  }

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
    <div className='max-w-4xl mx-auto p-8'>
      <div className='flex justify-between items-center mb-8'>
        <div className='flex gap-8 text-lg font-medium'>
          <div>Time: {timeElapsed}s</div>
          <div>Moves: {moves}</div>
          <div>Score: {score}</div>
        </div>
        <button
          onClick={handleExit}
          className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
        >
          Exit Game
        </button>
      </div>

      <div className='grid grid-cols-4 md:grid-cols-6 gap-4'>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched}
            className={`
              aspect-square rounded-lg transition-all duration-300 transform
              ${
                card.isMatched
                  ? 'bg-green-100 cursor-default'
                  : 'bg-blue-100 hover:bg-blue-200'
              }
              ${
                card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
              }
            `}
          >
            <div className='relative w-full h-full'>
              <div
                className={`absolute w-full h-full backface-hidden
                ${
                  card.isFlipped || card.isMatched
                    ? 'hidden'
                    : 'flex items-center justify-center'
                }
              `}
              >
                ?
              </div>
              <div
                className={`absolute w-full h-full backface-hidden
                ${
                  card.isFlipped || card.isMatched
                    ? 'flex items-center justify-center'
                    : 'hidden'
                }
              `}
              >
                <Image
                  src={`/images/${card.image}`}
                  alt='Card'
                  width={64}
                  height={64}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {!isGameActive && (
        <div className='mt-8 flex justify-center'>
          <button
            onClick={initializeGame}
            className='px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

export default Game

