import { GameDifficulty } from '../../app/game/types'

interface GameStatsProps {
  time: number
  moves: number
  difficulty: GameDifficulty
  isGameWon: boolean
}

/**
 * Displays game statistics and current status
 */
const GameStats = ({ time, moves, difficulty, isGameWon }: GameStatsProps) => {
  return (
    <div className="mb-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Memory Game</h2>
      <div className="flex justify-center gap-4">
        <div>Time: {time}s</div>
        <div>Moves: {moves}</div>
        <div>Difficulty: {difficulty}</div>
        {isGameWon && <div className="text-green-500 font-bold">You won!</div>}
      </div>
    </div>
  )
}

export default GameStats
