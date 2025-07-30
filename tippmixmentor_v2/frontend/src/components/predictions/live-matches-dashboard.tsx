'use client';

import { useState, useEffect } from 'react';
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

  // Subscribe to live matches updates
  useEffect(() => {
    if (isConnected) {
      getLiveMatches();
    }
  }, [isConnected, getLiveMatches]);

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

  const handleMatchSelect = (matchId: string) => {
    if (selectedMatchId) {
      unsubscribeFromMatch(selectedMatchId);
    }
    
    setSelectedMatchId(matchId);
    subscribeToMatch(matchId);
    onMatchSelect?.(matchId);
  };

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
      {/* Header */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Live Matches Dashboard
              </CardTitle>
              <CardDescription>
                Real-time match updates and live statistics
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${isConnected ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              </div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{liveMatches.length} live matches</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLiveMatches}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {wsError && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              WebSocket connection error: {wsError.message}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Matches List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Matches
          </h3>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading live matches...</div>
          ) : liveMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No live matches available</div>
          ) : (
            <div className="space-y-3">
              {liveMatches.map((match) => (
                <Card 
                  key={match.match_id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedMatchId === match.match_id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleMatchSelect(match.match_id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-full ${getStatusColor(match.live_data.status)}`}>
                          {getStatusIcon(match.live_data.status)}
                        </div>
                        <Badge variant="outline">{match.live_data.status}</Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(match.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold">
                        {match.live_data.score.home} - {match.live_data.score.away}
                      </div>
                      <div className="text-sm text-gray-600">
                        {match.match_info.home_team} vs {match.match_info.away_team}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{match.live_data.possession.home}%</div>
                        <div className="text-gray-500">Home</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{match.live_data.shots.home + match.live_data.shots.away}</div>
                        <div className="text-gray-500">Shots</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{match.live_data.possession.away}%</div>
                        <div className="text-gray-500">Away</div>
                      </div>
                    </div>

                    {match.weather && (
                      <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>{match.weather.city}</span>
                          <span>{match.weather.temperature}°C</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Selected Match Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Match Details
          </h3>

          {selectedMatchId ? (
            <RealTimeMLInsights 
              matchId={selectedMatchId}
              onPredictionUpdate={(prediction) => {
                console.log('ML Prediction updated:', prediction);
              }}
              onLiveDataUpdate={(liveData) => {
                console.log('Live data updated:', liveData);
              }}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  Select a match to view detailed analysis and ML insights
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Live Statistics Summary */}
      {liveMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Live Statistics Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {liveMatches.length}
                </div>
                <div className="text-sm text-gray-600">Live Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {liveMatches.filter(m => m.live_data.status === 'live').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {liveMatches.reduce((total, match) => 
                    total + match.live_data.score.home + match.live_data.score.away, 0
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {liveMatches.reduce((total, match) => 
                    total + match.live_data.cards.home.yellow + match.live_data.cards.away.yellow +
                    match.live_data.cards.home.red + match.live_data.cards.away.red, 0
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Cards</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 