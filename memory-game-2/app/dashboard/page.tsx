'use client'
import Game from '@/components/Game'
import { GameStats } from '@/types/user'
import { useState } from 'react'
import axios from 'axios'

const DashboardPage = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  // Handle game completion
  const handleGameComplete = async (stats: GameStats) => {
    try {
      await axios.post('/api/stats', stats)
    } catch (error) {
      console.error('Failed to save game stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-8">
      {!isPlaying ? (
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-8">Memory Game</h1>
          
          <div className="mb-8">
            <h2 className="text-xl mb-4">Select Difficulty</h2>
            <div className="flex gap-4 justify-center">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  className={`px-4 py-2 rounded-lg ${
                    difficulty === level
                      ? 'bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setDifficulty(level as typeof difficulty)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg text-lg font-semibold"
            onClick={() => setIsPlaying(true)}
          >
            Start Game
          </button>
        </div>
      ) : (
        <Game 
          difficulty={difficulty}
          onGameComplete={handleGameComplete}
        />
      )}
    </div>
  )
}

export default DashboardPage

