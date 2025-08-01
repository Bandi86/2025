'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFootballWebSocket, LiveMatch, OddsData } from '@/hooks/use-football-websocket';
import { Clock, Users, Trophy, TrendingUp, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

interface LiveMatchesDashboardProps {
  className?: string;
}

export const LiveMatchesDashboard: React.FC<LiveMatchesDashboardProps> = ({ className }) => {
  const {
    isConnected,
    liveMatches,
    odds,
    systemStatus,
    dataQuality,
    error,
    subscribeToLiveMatches,
    getLiveMatches,
    connect,
    disconnect,
    clearError,
  } = useFootballWebSocket({
    onError: (error) => console.error('WebSocket error:', error),
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
  });

  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [showOdds, setShowOdds] = useState<Record<string, boolean>>({});

  // Subscribe to live matches on mount
  useEffect(() => {
    if (isConnected) {
      subscribeToLiveMatches();
      getLiveMatches();
    }
  }, [isConnected, subscribeToLiveMatches, getLiveMatches]);

  // Get unique leagues from live matches
  const leagues = Array.from(new Set(liveMatches.map(match => match.league))).sort();

  // Filter matches by selected league
  const filteredMatches = selectedLeague === 'all' 
    ? liveMatches 
    : liveMatches.filter(match => match.league === selectedLeague);

  // Toggle odds display for a match
  const toggleOdds = (matchId: string) => {
    setShowOdds(prev => ({
      ...prev,
      [matchId]: !prev[matchId],
    }));
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('live') || lowerStatus.includes('in progress')) {
      return 'bg-red-500';
    } else if (lowerStatus.includes('halftime')) {
      return 'bg-yellow-500';
    } else if (lowerStatus.includes('scheduled')) {
      return 'bg-blue-500';
    } else {
      return 'bg-gray-500';
    }
  };

  // Format match time
  const formatMatchTime = (minute?: number) => {
    if (!minute) return '';
    if (minute <= 45) return `${minute}'`;
    if (minute <= 90) return `${minute}' (2H)`;
    return `${minute}' (ET)`;
  };

  // Get connection status icon
  const getConnectionIcon = () => {
    if (isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  // Get data quality status
  const getDataQualityStatus = () => {
    if (!dataQuality) return null;
    
    const quality = dataQuality.mergedDataQuality;
    if (quality >= 0.8) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (quality >= 0.5) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <h2 className="text-2xl font-bold">Live Matches</h2>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          {getDataQualityStatus() && (
            <div className="flex items-center space-x-2">
              {getDataQualityStatus()}
              <span className="text-sm text-muted-foreground">
                Data Quality: {dataQuality?.mergedDataQuality ? `${(dataQuality.mergedDataQuality * 100).toFixed(0)}%` : 'N/A'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!isConnected ? (
            <Button onClick={connect} size="sm">
              Connect
            </Button>
          ) : (
            <Button onClick={disconnect} variant="outline" size="sm">
              Disconnect
            </Button>
          )}
          <Button onClick={getLiveMatches} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
              <Button onClick={clearError} variant="ghost" size="sm">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      {systemStatus && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Badge variant={systemStatus.espn.status === 'healthy' ? 'default' : 'destructive'}>
                  ESPN
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {systemStatus.espn.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={systemStatus.apiFootball.status === 'healthy' ? 'default' : 'destructive'}>
                  API-Football
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {systemStatus.apiFootball.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={systemStatus.footballData.status === 'healthy' ? 'default' : 'destructive'}>
                  Football-Data
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {systemStatus.footballData.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* League Tabs */}
      <Tabs value={selectedLeague} onValueChange={setSelectedLeague}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Leagues</TabsTrigger>
          {leagues.slice(0, 5).map(league => (
            <TabsTrigger key={league} value={league}>
              {league}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedLeague} className="mt-4">
          {filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No live matches at the moment</p>
                  <p className="text-sm">Check back later for live games</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    {/* Match Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(match.status)}>
                          {match.status}
                        </Badge>
                        {match.minute && (
                          <Badge variant="outline">
                            {formatMatchTime(match.minute)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{match.league}</span>
                      </div>
                    </div>

                    {/* Match Details */}
                    <div className="grid grid-cols-3 gap-4 items-center mb-4">
                      <div className="text-center">
                        <div className="font-semibold">{match.homeTeam}</div>
                        <div className="text-2xl font-bold text-primary">
                          {match.homeScore !== undefined ? match.homeScore : '-'}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">VS</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(match.lastUpdated).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-semibold">{match.awayTeam}</div>
                        <div className="text-2xl font-bold text-primary">
                          {match.awayScore !== undefined ? match.awayScore : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Odds Section */}
                    {match.odds && match.odds.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Betting Odds</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleOdds(match.id)}
                          >
                            {showOdds[match.id] ? 'Hide' : 'Show'} Odds
                          </Button>
                        </div>
                        
                        {showOdds[match.id] && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {match.odds.map((odd, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div>
                                  <div className="text-sm font-medium">{odd.provider}</div>
                                  <div className="text-xs text-muted-foreground">{odd.details}</div>
                                </div>
                                {odd.overUnder && (
                                  <Badge variant="secondary">
                                    O/U {odd.overUnder}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Live Matches Count */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {liveMatches.length} live match{liveMatches.length !== 1 ? 'es' : ''} across {leagues.length} league{leagues.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}; 