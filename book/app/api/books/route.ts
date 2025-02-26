import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: Összes könyv lekérdezése
export async function GET() {
  const books = await prisma.book.findMany({ include: { reviews: true } })
  return NextResponse.json(books)
}

// POST: Új könyv létrehozása
export async function POST(req: Request) {
  try {
    const { title, author, description, coverImage, price } = await req.json()

    if (!title || !author || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const book = await prisma.book.create({
      data: { title, author, description, coverImage, price }
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 })
  }
}


// PUT: Könyv szerkesztése
export async function PUT(req: Request) {
  try {
    const { id, title, author, description, coverImage, price } = await req.json()

    if (!id || !title || !author || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const book = await prisma.book.update({
      where: { id },
      data: { title, author, description, coverImage, price }
    })

    return NextResponse.json(book, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 })
  }
    }

// DELETE: Könyv törlése
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const book = await prisma.book.delete({
      where: { id }
    })

    return NextResponse.json(book, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 })
  }
}
    


    