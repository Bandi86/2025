'use client'
import Stats from "@/components/Stats"
import Link from "next/link"
import { useState } from "react"

export default function Home() {

  
  const [difficulty, setDifficulty] = useState('easy')
  
  

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8">
          Memory Game
        </h1>
        
        <div className="space-y-6">
          <p className="text-center text-white/80 text-lg">
            Test your memory with 3 difficulty levels:
          </p>
          
          <div className="flex justify-center gap-4">
            <button 
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${difficulty === 'easy' ? 'bg-green-500 text-white scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={() => setDifficulty('easy')}
            >
              Easy
            </button>
            <button 
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${difficulty === 'medium' ? 'bg-yellow-500 text-white scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={() => setDifficulty('medium')}
            >
              Medium
            </button>
            <button 
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${difficulty === 'hard' ? 'bg-red-500 text-white scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={() => setDifficulty('hard')}
            >
              Hard
            </button>
          </div>

          <Link href={`/game?difficulty=${difficulty}`}>
            <button className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105">
              Start Game
            </button>
          </Link>
        </div>
      </div>
      <Stats />
    </section>
  )
}
