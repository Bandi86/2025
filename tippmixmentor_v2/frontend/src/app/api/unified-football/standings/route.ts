import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competition = searchParams.get('competition');

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition is required' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams();
    params.append('competition', competition);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/unified-football/standings?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching unified football standings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
} 