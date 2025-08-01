import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competition: string }> }
) {
  try {
    const { competition } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const params2 = new URLSearchParams();
    if (limit) params2.append('limit', limit);

    const response = await fetch(`${apiUrl}/api/v1/football-data/scorers/${competition}?${params2.toString()}`, {
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
    console.error('Error fetching football data scorers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch football data scorers' },
      { status: 500 }
    );
  }
} 