import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competition = searchParams.get('competition');
    const limit = searchParams.get('limit');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const params = new URLSearchParams();
    if (competition) params.append('competition', competition);
    if (limit) params.append('limit', limit);

    const response = await fetch(`${apiUrl}/api/v1/football-data/matches?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching football data matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch football data matches' },
      { status: 500 }
    );
  }
} 