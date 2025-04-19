import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Articles } from '@prisma/client';

// GET all articles
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Fetch all articles from the database
    const articles: Articles[] = await prisma.articles.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        date: true,
        tags: true,
        description: true,
        image: true,
        published: true,
        // Add other fields as needed
      },
      orderBy: {
        date: 'desc', // Sort by creation date, newest first
      },
    });

    // Check if articles exist
    if (articles.length === 0) {
      return NextResponse.json({ message: 'No articles found' }, { status: 404 });
    }

    // Return successful response
    return NextResponse.json(
      { data: articles, message: 'Articles fetched successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    // Disconnect Prisma client to prevent connection leaks
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }
    const article = await prisma.articles.create({
      data: {
        title: body.title,
        content: body.content,
        date: new Date(),
        tags: body.tags,
        description: body.description,
        image: body.image,
        published: body.published,
      },
    });
    return NextResponse.json({ data: article }, { status: 201 });
  } catch (error) {
    console.error('Error creating articles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {}

export async function DELETE(request: Request) {}

export async function PATCH(request: Request) {}
