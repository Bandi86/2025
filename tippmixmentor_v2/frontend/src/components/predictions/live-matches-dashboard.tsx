'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  Users, 
  Target,
  BarChart3,
  Eye,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';
import { RealTimeMLInsights } from './real-time-ml-insights';

interface LiveMatch {
  match_id: string;
  match_info: {
    home_team: string;
    away_team: string;
    league: string;
    venue: string;
    match_date: string;
    status: string;
  };
  live_data: {
    status: string;
    score: { home: number; away: number };
    time: string;
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    corners: { home: number; away: number };
    cards: { home: { yellow: number; red: number }; away: { yellow: number; red: number } };
  };
  weather: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    description: string;
    city: string;
  };
  timestamp: string;
}

interface LiveMatchesDashboardProps {
  onMatchSelect?: (matchId: string) => void;
}

export function LiveMatchesDashboard({ onMatchSelect }: LiveMatchesDashboardProps) {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const {
    isConnected,
    isConnecting,
    error: wsError,
    lastMessage,
    subscribeToMatch,
    unsubscribeFromMatch,
    getLiveMatches,
  } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'liveMatches') {
        setLiveMatches(message.data);
      } else if (message.type === 'matchUpdate' && selectedMatchId === message.data.matchId) {
        // Update the specific match in the list
        setLiveMatches(prev => 
          prev.map(match => 
            match.match_id === message.data.matchId 
              ? { ...match, ...message.data.data }
              : match
          )
        );
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  // Fetch live matches on component mount
  useEffect(() => {
    fetchLiveMatches();
  }, []);

  // Subscribe to live matches updates when connected
  useEffect(() => {
    if (isConnected) {
      getLiveMatches();
    }
  }, [isConnected]); // Remove getLiveMatches from dependencies

  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/live-data/matches/live`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch live matches');
      }

      const data = await response.json();
      setLiveMatches(data);
    } catch (err) {
      setError('Failed to fetch live matches');
      console.error('Live matches error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchSelect = useCallback((matchId: string) => {
    if (selectedMatchId) {
      unsubscribeFromMatch(selectedMatchId);
    }
    
    setSelectedMatchId(matchId);
    subscribeToMatch(matchId);
    onMatchSelect?.(matchId);
  }, [selectedMatchId, unsubscribeFromMatch, subscribeToMatch, onMatchSelect]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'in_progress':
        return 'text-green-600 bg-green-100';
      case 'finished':
      case 'ended':
        return 'text-gray-600 bg-gray-100';
      case 'scheduled':
      case 'upcoming':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'finished':
      case 'ended':
        return <Square className="h-4 w-4" />;
      case 'scheduled':
      case 'upcoming':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Matches Dashboard
            <div className="flex items-center gap-2 ml-auto">
              {isConnected ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : isConnecting ? (
                <Badge variant="secondary">
                  <Activity className="h-3 w-3 mr-1 animate-spin" />
                  Connecting...
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Real-time football match data and live updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wsError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">
                WebSocket connection error: {wsError.message}
              </p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-gray-600">Loading live matches...</p>
              </div>
            </div>
          ) : liveMatches.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Live Matches</h3>
              <p className="text-gray-600">There are currently no live matches available.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveMatches.map((match) => (
                <Card key={match.match_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(match.live_data.status)}>
                        {getStatusIcon(match.live_data.status)}
                        <span className="ml-1">{match.live_data.status}</span>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMatchSelect(match.match_id)}
                        className="h-6 px-2"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg">
                      {match.match_info.home_team} vs {match.match_info.away_team}
                    </CardTitle>
                    <CardDescription>
                      {match.match_info.league} • {match.match_info.venue}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Score */}
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {match.live_data.score.home} - {match.live_data.score.away}
                        </div>
                        <div className="text-sm text-gray-500">
                          {match.live_data.time}
                        </div>
                      </div>

                      {/* Match Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700">Possession</div>
                          <div className="flex items-center gap-2">
                            <Progress value={match.live_data.possession.home} className="flex-1" />
                            <span className="text-xs">{match.live_data.possession.home}%</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={match.live_data.possession.away} className="flex-1" />
                            <span className="text-xs">{match.live_data.possession.away}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">Shots</div>
                          <div className="text-center">
                            <span className="font-semibold">{match.live_data.shots.home}</span>
                            <span className="text-gray-400 mx-1">-</span>
                            <span className="font-semibold">{match.live_data.shots.away}</span>
                          </div>
                        </div>
                      </div>

                      {/* Weather Info */}
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{match.weather.city}</span>
                          <span>{match.weather.temperature}°C</span>
                          <span>{match.weather.description}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time ML Insights */}
      {selectedMatchId && (
        <RealTimeMLInsights matchId={selectedMatchId} />
      )}
    </div>
  );
} 