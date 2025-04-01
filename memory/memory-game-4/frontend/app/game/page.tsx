'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import confetti from 'canvas-confetti'
import { GameDifficulty, GameState, Card as CardType } from './types' // Renamed imported Card type
import { GAME_CONFIGS, initializeGame, handleCardClick } from './gameLogic' // Removed formatTime as it's likely in GameStats
import Card from '../../components/game/Card' // Component import
import GameStats from '../../components/game/GameStats'

/**
 * Main Memory Game component
 */
const MemoryGame = () => {
  const searchParams = useSearchParams()
  const difficultyParam = searchParams.get('difficulty')
  // Validate difficulty param or default to 'easy'
  const difficulty: GameDifficulty = ['easy', 'medium', 'hard'].includes(difficultyParam || '')
    ? (difficultyParam as GameDifficulty)
    : 'easy'

  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to load saved game state only on the client side
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(`memoryGameState_${difficulty}`) // Difficulty-specific save
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)
          // Basic validation of saved state structure
          if (parsedState && Array.isArray(parsedState.cards)) {
            return parsedState
          }
        } catch (e) {
          console.error('Failed to parse saved game state:', e)
          localStorage.removeItem(`memoryGameState_${difficulty}`) // Clear invalid state
        }
      }
    }
    // Default initial state if no valid saved state
    return initializeGame(difficulty)
  })

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`memoryGameState_${difficulty}`, JSON.stringify(gameState))
    }
  }, [gameState, difficulty])

  // Initialize or reset game when difficulty changes
  useEffect(() => {
    // Check if the current state's difficulty matches the URL param
    // This prevents re-initializing if the state was loaded correctly from localStorage
    const loadedDifficulty =
      gameState.cards.length > 0
        ? (Object.keys(GAME_CONFIGS).find(
            (key) => GAME_CONFIGS[key as GameDifficulty].pairs * 2 === gameState.cards.length
          ) as GameDifficulty | undefined)
        : undefined

    if (loadedDifficulty !== difficulty) {
      console.log(`Initializing game for difficulty: ${difficulty}`)
      const newState = initializeGame(difficulty)
      setGameState(newState)
      // Clear local storage for other difficulties if needed, or just the current one before setting new
      localStorage.removeItem(`memoryGameState_${difficulty}`)
    }
  }, [difficulty]) // Rerun only when difficulty param changes

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined
    if (gameState.isGameStarted && !gameState.isGameWon) {
      interval = setInterval(() => {
        setGameState((prev) => ({ ...prev, timer: prev.timer + 1 }))
      }, 1000)
    } else if (interval) {
      clearInterval(interval) // Clear interval if game is won or not started
    }
    // Cleanup function to clear interval when component unmounts or dependencies change
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState.isGameStarted, gameState.isGameWon])

  // Effect to handle flipping cards back on mismatch
  useEffect(() => {
    // Check if two cards are flipped
    if (gameState.flippedCardIds.length === 2) {
      const [firstCardId, secondCardId] = gameState.flippedCardIds;
      const firstCard = gameState.cards.find(c => c.id === firstCardId);
      const secondCard = gameState.cards.find(c => c.id === secondCardId);

      // If they don't match, flip them back after a delay
      if (firstCard && secondCard && firstCard.value !== secondCard.value) {
        const timeoutId = setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            flippedCardIds: [], // Clear flipped cards
            cards: prev.cards.map(card => 
              card.id === firstCardId || card.id === secondCardId 
                ? { ...card, isFlipped: false } // Flip back
                : card
            )
          }));
        }, 1000); // 1 second delay

        // Cleanup timeout if component unmounts or dependencies change before timeout fires
        return () => clearTimeout(timeoutId);
      }
    }
  }, [gameState.flippedCardIds, gameState.cards]); // Depend on flippedCardIds and cards


  // Handle card click
  const onCardClick = (id: number) => {
    const newState = handleCardClick(gameState, id)
    setGameState(newState)

    // Trigger confetti if game is won on this click
    if (newState.isGameWon && !gameState.isGameWon) {
      confetti({
        particleCount: 150, // More particles!
        spread: 90, // Wider spread
        origin: { y: 0.6 }
      })
    }
  }

  // Restart game
  const restartGame = () => {
    console.log(`Restarting game for difficulty: ${difficulty}`)
    const newState = initializeGame(difficulty)
    setGameState(newState)
    localStorage.removeItem(`memoryGameState_${difficulty}`) // Clear saved state on restart
  }

  // Determine grid layout based on difficulty
  const { cols } = GAME_CONFIGS[difficulty]
  const gridClass = cols === 4 ? 'grid-cols-4' : 'grid-cols-6' // Correct Tailwind classes

  // Ensure cards array is populated before rendering grid
  if (!gameState.cards || gameState.cards.length === 0) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading game...</div> // Or a loading spinner
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <GameStats
        time={gameState.timer}
        moves={gameState.moves}
        difficulty={difficulty}
        isGameWon={gameState.isGameWon}
      />

      {/* Apply perspective here for the card flip effect */}
      <div className={`grid ${gridClass} gap-2 sm:gap-4 perspective-1000 mt-6`}>
        {gameState.cards.map(
          (
            card: CardType // Use the imported CardType
          ) => (
            <Card
              key={card.id}
              id={card.id}
              content={card.value} // Use card.value from the state object
              isFlipped={card.isFlipped}
              isMatched={card.isMatched}
              onClick={onCardClick}
              // Removed isGameActive prop as Card component doesn't use it
            />
          )
        )}
      </div>

      <div className="mt-8 flex justify-center gap-4">
        {/* Show restart button always when game started, or play again when won */}
        {(gameState.isGameStarted || gameState.isGameWon) && (
          <button
            onClick={restartGame}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            {gameState.isGameWon ? 'Play Again' : 'Restart Game'}
          </button>
        )}
        <button
          onClick={() => {
            // Optionally clear state before exiting
            // localStorage.removeItem(`memoryGameState_${difficulty}`);
            window.location.href = '/' // Navigate to home or selection page
          }}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-md"
        >
          Exit Game
        </button>
      </div>
    </div>
  )
}

export default MemoryGame
