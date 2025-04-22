import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Post } from '@prisma/client';

// GET all posts
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Fetch all posts from the database
    const posts: Post[] = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true, // Added slug
        content: true,
        excerpt: true, // Changed description to excerpt
        published: true,
        featuredImage: true, // Changed image to featuredImage
        createdAt: true, // Changed date to createdAt
        updatedAt: true, // Added updatedAt
        categoryId: true, // Added categoryId
        authorId: true, // Added authorId
        author: { // Include author details
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        category: { 
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Check if posts exist
    if (posts.length === 0) {
      return NextResponse.json({ message: 'No posts found' }, { status: 404 });
    }

    // Return successful response
    return NextResponse.json(
      { data: posts, message: 'Posts fetched successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
    console.error('Error fetching posts:', error); 
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  
}

// POST a new post
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    // Added slug and authorId to required fields check
    if (!body.title || !body.content || !body.slug || !body.authorId) {
      return NextResponse.json({ error: 'Title, content, slug, and authorId are required' }, { status: 400 });
    }
    const post = await prisma.post.create({ 
      data: {
        title: body.title,
        slug: body.slug, // Added slug
        content: body.content,
        excerpt: body.excerpt, // Changed description to excerpt
        published: body.published ?? false, // Default published to false if not provided
        featuredImage: body.featuredImage, // Changed image to featuredImage
        authorId: body.authorId, // Added authorId (required)
        categoryId: body.categoryId, // Added categoryId (optional)        
      },
    });
    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    // Add more specific error handling for unique constraint violations (e.g., slug)
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
       return NextResponse.json({ error: 'A post with this slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  
}

// TODO: Implement PUT, DELETE, PATCH handlers
export async function PUT(request: Request) {}

export async function DELETE(request: Request) {}

export async function PATCH(request: Request) {}
