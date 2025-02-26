import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
export async function POST(req: Request) {
  try {
    const { rating, comment, userId, bookId } = await req.json()

    if (!rating || !userId || !bookId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: { rating, comment, userId, bookId }
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const reviews = await prisma.review.findMany({ include: { user: true, book: true } })
    return NextResponse.json(reviews)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
