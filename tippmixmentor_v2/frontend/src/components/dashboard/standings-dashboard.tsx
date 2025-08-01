'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFootballWebSocket, StandingsData } from '@/hooks/use-football-websocket';
import { Trophy, TrendingUp, TrendingDown, Minus, Clock, RefreshCw } from 'lucide-react';

interface StandingsDashboardProps {
  className?: string;
}

const LEAGUES = [
  { code: 'PL', name: 'Premier League', country: 'England' },
  { code: 'PD', name: 'La Liga', country: 'Spain' },
  { code: 'SA', name: 'Serie A', country: 'Italy' },
  { code: 'BL1', name: 'Bundesliga', country: 'Germany' },
  { code: 'FL1', name: 'Ligue 1', country: 'France' },
  { code: 'CL', name: 'Champions League', country: 'Europe' },
  { code: 'EL', name: 'Europa League', country: 'Europe' },
];

export const StandingsDashboard: React.FC<StandingsDashboardProps> = ({ className }) => {
  const {
    isConnected,
    standings,
    subscribeToStandings,
    getStandings,
    connect,
    disconnect,
  } = useFootballWebSocket();

  const [selectedLeague, setSelectedLeague] = useState<string>('PL');
  const [lastUpdated, setLastUpdated] = useState<Record<string, string>>({});

  // Subscribe to standings for selected league
  useEffect(() => {
    if (isConnected && selectedLeague) {
      subscribeToStandings(selectedLeague);
      getStandings(selectedLeague);
    }
  }, [isConnected, selectedLeague, subscribeToStandings, getStandings]);

  // Get current standings for selected league
  const currentStandings = standings[selectedLeague] || [];

  // Get league info
  const selectedLeagueInfo = LEAGUES.find(league => league.code === selectedLeague);

  // Handle league change
  const handleLeagueChange = (leagueCode: string) => {
    setSelectedLeague(leagueCode);
  };

  // Get form indicator
  const getFormIndicator = (position: number, previousPosition?: number) => {
    if (!previousPosition) return <Minus className="h-3 w-3 text-gray-400" />;
    
    if (position < previousPosition) {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    } else if (position > previousPosition) {
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    } else {
      return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  // Get position color
  const getPositionColor = (position: number) => {
    if (position <= 4) return 'text-green-600 font-bold'; // Champions League
    if (position <= 6) return 'text-blue-600 font-semibold'; // Europa League
    if (position >= 18) return 'text-red-600 font-semibold'; // Relegation
    return 'text-gray-900';
  };

  // Get goal difference color
  const getGoalDifferenceColor = (goalDifference: number) => {
    if (goalDifference > 0) return 'text-green-600';
    if (goalDifference < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Format last updated time
  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">League Standings</h2>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
          
          {selectedLeagueInfo && (
            <div className="text-sm text-muted-foreground">
              {selectedLeagueInfo.name} • {selectedLeagueInfo.country}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => getStandings(selectedLeague)}
            variant="outline"
            size="sm"
            disabled={!isConnected}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* League Selector */}
      <div className="mb-6">
        <Select value={selectedLeague} onValueChange={handleLeagueChange}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a league" />
          </SelectTrigger>
          <SelectContent>
            {LEAGUES.map((league) => (
              <SelectItem key={league.code} value={league.code}>
                <div className="flex items-center space-x-2">
                  <span>{league.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {league.country}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Standings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Standings</span>
            {lastUpdated[selectedLeague] && (
              <span className="text-sm text-muted-foreground font-normal">
                Last updated: {formatLastUpdated(lastUpdated[selectedLeague])}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStandings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No standings data available</p>
              <p className="text-sm">Select a different league or try refreshing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pos</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">W</TableHead>
                    <TableHead className="text-center">D</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead className="text-center">GF</TableHead>
                    <TableHead className="text-center">GA</TableHead>
                    <TableHead className="text-center">GD</TableHead>
                    <TableHead className="text-center">Pts</TableHead>
                    <TableHead className="text-center">Form</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentStandings.map((team, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className={`font-medium ${getPositionColor(team.position)}`}>
                        {team.position}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span>{team.team}</span>
                          <Badge variant="outline" className="text-xs">
                            {team.source}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{team.played}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">
                        {team.won}
                      </TableCell>
                      <TableCell className="text-center text-yellow-600 font-medium">
                        {team.drawn}
                      </TableCell>
                      <TableCell className="text-center text-red-600 font-medium">
                        {team.lost}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {team.goalsFor}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {team.goalsAgainst}
                      </TableCell>
                      <TableCell className={`text-center font-medium ${getGoalDifferenceColor(team.goalsFor - team.goalsAgainst)}`}>
                        {team.goalsFor - team.goalsAgainst > 0 ? '+' : ''}
                        {team.goalsFor - team.goalsAgainst}
                      </TableCell>
                      <TableCell className="text-center font-bold text-primary">
                        {team.points}
                      </TableCell>
                      <TableCell className="text-center">
                        {getFormIndicator(team.position)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span>Champions League</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Europa League</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Relegation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Mid-table</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Info */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>Data sources: ESPN, API-Football, Football-Data.org</p>
        <p>Updates every hour • Real-time connection status shown above</p>
      </div>
    </div>
  );
}; 