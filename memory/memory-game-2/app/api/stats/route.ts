import { NextResponse } from 'next/server'
import db from '@/db/config'
import { GameStats } from '@/types/user'

export async function POST(request: Request) {
  try {
    const stats: GameStats = await request.json()

    db.run(
      `INSERT INTO game_stats (user_id, score, time_elapsed, difficulty, completed)
       VALUES (?, ?, ?, ?, ?)`,
      [
        stats.userId,
        stats.score,
        stats.timeElapsed,
        stats.difficulty,
        stats.completed,
      ]
    )

    return NextResponse.json({ message: 'Stats saved successfully' })
  } catch (error) {
    console.error('Failed to save game stats:', error)
    return NextResponse.json(
      { error: 'Failed to save game stats' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const stats = db.all(
      'SELECT * FROM game_stats ORDER BY score DESC LIMIT 10'
    )

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch game stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game stats' },
      { status: 500 }
    )
  }
}
