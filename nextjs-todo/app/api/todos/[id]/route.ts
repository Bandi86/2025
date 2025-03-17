import { NextResponse, NextRequest } from 'next/server'
import { toggleTodo, deleteTodo } from '@/db/config'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    await toggleTodo(id)
    return NextResponse.json({ message: 'Todo toggled' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to toggle todo' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    await deleteTodo(id)
    return NextResponse.json({ message: 'Todo deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}