'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Medal
} from 'lucide-react';

interface Standing {
  position: number;
  team: {
    id: string;
    name: string;
    logo?: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string[];
  source?: string;
}

interface ESPNStanding {
  team: {
    id: string;
    uid: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    location: string;
    color: string;
    alternateColor: string;
    logo: string;
  };
  note?: {
    color: string;
    description: string;
    rank: number;
  };
  stats: Array<{
    name: string;
    value: number | string;
    displayValue: string;
  }>;
}

export function StandingsDashboard() {
  const [selectedLeague, setSelectedLeague] = useState<string>('eng.1');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leagues = [
    { id: 'eng.1', name: 'Premier League', country: 'England' },
    { id: 'esp.1', name: 'La Liga', country: 'Spain' },
    { id: 'ita.1', name: 'Serie A', country: 'Italy' },
    { id: 'ger.1', name: 'Bundesliga', country: 'Germany' },
    { id: 'fra.1', name: 'Ligue 1', country: 'France' },
    { id: 'uefa.champions', name: 'UEFA Champions League', country: 'Europe' },
  ];

  useEffect(() => {
    fetchStandings(selectedLeague);
  }, [selectedLeague]);

  const fetchStandings = async (leagueCode: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/espn-football/standings/${leagueCode}`);
      const data = await response.json();
      
      if (data.success && data.data.standings) {
        const formattedStandings = data.data.standings.map((standing: ESPNStanding) => ({
          position: parseInt(standing.stats.find(s => s.name === 'rank')?.displayValue || '0'),
          team: {
            id: standing.team.id,
            name: standing.team.displayName,
            logo: standing.team.logo,
          },
          playedGames: parseInt(standing.stats.find(s => s.name === 'gamesPlayed')?.displayValue || '0'),
          won: parseInt(standing.stats.find(s => s.name === 'wins')?.displayValue || '0'),
          draw: parseInt(standing.stats.find(s => s.name === 'ties')?.displayValue || '0'),
          lost: parseInt(standing.stats.find(s => s.name === 'losses')?.displayValue || '0'),
          points: parseInt(standing.stats.find(s => s.name === 'points')?.displayValue || '0'),
          goalsFor: parseInt(standing.stats.find(s => s.name === 'pointsFor')?.displayValue || '0'),
          goalsAgainst: parseInt(standing.stats.find(s => s.name === 'pointsAgainst')?.displayValue || '0'),
          goalDifference: parseInt(standing.stats.find(s => s.name === 'pointDifferential')?.displayValue || '0'),
          source: 'ESPN'
        }));
        
        setStandings(formattedStandings);
      }
    } catch (err) {
      console.error('Error fetching standings:', err);
      setError('Failed to fetch standings data');
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Medal className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getFormColor = (form: string) => {
    switch (form) {
      case 'W': return 'text-green-600';
      case 'D': return 'text-yellow-600';
      case 'L': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleRefresh = () => {
    fetchStandings(selectedLeague);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">League Standings</h1>
          <p className="text-gray-600 mt-1">
            Current standings and team performance across major leagues
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* League Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select League</CardTitle>
          <CardDescription>
            Choose a league to view current standings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {leagues.map((league) => (
              <Button
                key={league.id}
                variant={selectedLeague === league.id ? "default" : "outline"}
                className="flex flex-col items-center space-y-2 h-auto p-4"
                onClick={() => setSelectedLeague(league.id)}
              >
                <Trophy className="w-5 h-5" />
                <div className="text-center">
                  <p className="font-medium text-sm">{league.name}</p>
                  <p className="text-xs text-gray-500">{league.country}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Standings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>
              {leagues.find(l => l.id === selectedLeague)?.name} Standings
            </span>
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            Current season standings and team statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600" />
              <p className="mt-2 text-gray-600">Loading standings...</p>
            </div>
          ) : standings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No standings data available for this league</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Pos</th>
                    <th className="text-left p-3 font-medium">Team</th>
                    <th className="text-center p-3 font-medium">P</th>
                    <th className="text-center p-3 font-medium">W</th>
                    <th className="text-center p-3 font-medium">D</th>
                    <th className="text-center p-3 font-medium">L</th>
                    <th className="text-center p-3 font-medium">GF</th>
                    <th className="text-center p-3 font-medium">GA</th>
                    <th className="text-center p-3 font-medium">GD</th>
                    <th className="text-center p-3 font-medium">Pts</th>
                    <th className="text-center p-3 font-medium">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing, index) => (
                    <tr 
                      key={standing.team.id} 
                      className={`border-b hover:bg-gray-50 ${
                        index < 4 ? 'bg-green-50' : 
                        index >= standings.length - 3 ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          {getPositionIcon(standing.position)}
                          <span className="font-medium">{standing.position}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          {standing.team.logo && (
                            <img 
                              src={standing.team.logo} 
                              alt={standing.team.name}
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          <div>
                            <p className="font-medium">{standing.team.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {standing.source}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">{standing.playedGames}</td>
                      <td className="p-3 text-center text-green-600 font-medium">{standing.won}</td>
                      <td className="p-3 text-center text-yellow-600 font-medium">{standing.draw}</td>
                      <td className="p-3 text-center text-red-600 font-medium">{standing.lost}</td>
                      <td className="p-3 text-center">{standing.goalsFor}</td>
                      <td className="p-3 text-center">{standing.goalsAgainst}</td>
                      <td className="p-3 text-center">
                        <span className={`font-medium ${
                          standing.goalDifference > 0 ? 'text-green-600' : 
                          standing.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-lg">{standing.points}</td>
                      <td className="p-3 text-center">
                        {standing.form && (
                          <div className="flex space-x-1">
                            {standing.form.slice(-5).map((result, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full text-xs flex items-center justify-center ${
                                  result === 'W' ? 'bg-green-100 text-green-600' :
                                  result === 'D' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-red-100 text-red-600'
                                }`}
                              >
                                {result}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Standings Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span className="text-sm">Champions League Qualification</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
              <span className="text-sm">Relegation Zone</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
              <span className="text-sm">Europa League Qualification</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 