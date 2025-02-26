import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type Params = {
  params: { id: string }
}

export async function GET(req: Request, { params }: Params) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: { reviews: true }
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 })
  }
  
}
