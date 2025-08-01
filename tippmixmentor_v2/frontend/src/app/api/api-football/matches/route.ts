import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league');
    const season = searchParams.get('season');
    const round = searchParams.get('round');

    if (!league || !season) {
      return NextResponse.json(
        { error: 'League and season are required' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams();
    params.append('league', league);
    params.append('season', season);
    if (round) params.append('round', round);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-football/matches?${params.toString()}`, {
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
    console.error('Error fetching API-Football matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
} 