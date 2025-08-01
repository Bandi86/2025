import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/live-data/matches/live`, {
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
    console.error('Error fetching live matches:', error);
    // Return mock data for now since the backend endpoint might not exist
    return NextResponse.json([
      {
        match_id: 'mock-1',
        match_info: {
          home_team: 'Manchester United',
          away_team: 'Liverpool',
          league: 'Premier League',
          venue: 'Old Trafford',
          match_date: new Date().toISOString(),
          status: 'live',
        },
        live_data: {
          status: 'in_progress',
          score: { home: 2, away: 1 },
          time: '65\'',
          possession: { home: 45, away: 55 },
          shots: { home: 8, away: 12 },
          corners: { home: 4, away: 6 },
          cards: { home: { yellow: 1, red: 0 }, away: { yellow: 2, red: 0 } },
        },
        weather: {
          temperature: 18,
          humidity: 65,
          wind_speed: 12,
          description: 'Partly cloudy',
          city: 'Manchester',
        },
        timestamp: new Date().toISOString(),
      },
      {
        match_id: 'mock-2',
        match_info: {
          home_team: 'Arsenal',
          away_team: 'Chelsea',
          league: 'Premier League',
          venue: 'Emirates Stadium',
          match_date: new Date().toISOString(),
          status: 'scheduled',
        },
        live_data: {
          status: 'scheduled',
          score: { home: 0, away: 0 },
          time: 'Not started',
          possession: { home: 0, away: 0 },
          shots: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          cards: { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } },
        },
        weather: {
          temperature: 16,
          humidity: 70,
          wind_speed: 8,
          description: 'Light rain',
          city: 'London',
        },
        timestamp: new Date().toISOString(),
      },
    ]);
  }
} 