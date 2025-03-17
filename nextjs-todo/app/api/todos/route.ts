import { NextResponse, NextRequest } from 'next/server'
import { getTodos, addTodo } from '@/db/config'

export async function GET() {
  try {
    const todos = await getTodos()
    return NextResponse.json(todos)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const id = await addTodo(title)
    return NextResponse.json({ id, title, completed: false }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add todo' }, { status: 500 })
  }
}
