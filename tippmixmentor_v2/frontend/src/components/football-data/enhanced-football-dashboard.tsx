'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Calendar, 
  Trophy, 
  Users, 
  Target,
  TrendingUp,
  Activity,
  Globe,
  Clock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  date: Date;
  status: 'scheduled' | 'live' | 'finished';
  competition: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
  source?: string;
}

interface League {
  id: string;
  name: string;
  country: string;
  season: string;
  currentMatchday: number;
  totalMatchdays: number;
}

interface ESPNLeague {
  id: string;
  name: string;
  code: string;
  sport: string;
  country: string;
}

interface ESPNMatch {
  id: string;
  name: string;
  date: string;
  status: {
    type: {
      name: string;
      state: string;
      completed: boolean;
    };
  };
  competitions: Array<{
    competitors: Array<{
      homeAway: string;
      score: string;
      team: {
        displayName: string;
        abbreviation: string;
      };
    }>;
    odds?: Array<{
      moneyline?: {
        home?: { odds: string };
        away?: { odds: string };
        draw?: { odds: string };
      };
    }>;
  }>;
}

export function EnhancedFootballDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [leagues, setLeagues] = useState<ESPNLeague[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leagues on component mount
  useEffect(() => {
    fetchLeagues();
  }, []);

  // Fetch matches when league changes
  useEffect(() => {
    if (selectedLeague !== 'all') {
      fetchMatches(selectedLeague);
    }
  }, [selectedLeague]);

  // Fetch live matches periodically
  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/v1/espn-football/leagues');
      const data = await response.json();
      if (data.success) {
        setLeagues(data.data);
      }
    } catch (err) {
      console.error('Error fetching leagues:', err);
      setError('Failed to fetch leagues');
    }
  };

  const fetchMatches = async (leagueCode: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/espn-football/scoreboard/${leagueCode}`);
      const data = await response.json();
      if (data.success && data.data.events) {
        const formattedMatches = data.data.events.map((event: ESPNMatch) => ({
          id: event.id,
          homeTeam: event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team.displayName || 'Unknown',
          awayTeam: event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team.displayName || 'Unknown',
          homeScore: parseInt(event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.score || '0'),
          awayScore: parseInt(event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.score || '0'),
          date: new Date(event.date),
          status: getMatchStatus(event.status.type.state),
          competition: data.data.leagues[0]?.name || 'Unknown',
          odds: event.competitions[0]?.odds?.[0]?.moneyline ? {
            home: parseFloat(event.competitions[0].odds[0].moneyline.home?.odds || '0'),
            draw: parseFloat(event.competitions[0].odds[0].moneyline.draw?.odds || '0'),
            away: parseFloat(event.competitions[0].odds[0].moneyline.away?.odds || '0')
          } : undefined,
          source: 'ESPN'
        }));
        setMatches(formattedMatches);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMatches = async () => {
    try {
      const response = await fetch('/api/v1/espn-football/live-matches');
      const data = await response.json();
      if (data.success && data.data.matches) {
        const formattedLiveMatches = data.data.matches.map((event: ESPNMatch) => ({
          id: event.id,
          homeTeam: event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team.displayName || 'Unknown',
          awayTeam: event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team.displayName || 'Unknown',
          homeScore: parseInt(event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.score || '0'),
          awayScore: parseInt(event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.score || '0'),
          date: new Date(event.date),
          status: 'live' as const,
          competition: 'Live Match',
          source: 'ESPN'
        }));
        setLiveMatches(formattedLiveMatches);
      }
    } catch (err) {
      console.error('Error fetching live matches:', err);
    }
  };

  const getMatchStatus = (state: string): 'scheduled' | 'live' | 'finished' => {
    switch (state) {
      case 'pre': return 'scheduled';
      case 'in': return 'live';
      case 'post': return 'finished';
      default: return 'scheduled';
    }
  };

  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         match.competition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'all' || match.competition === leagues.find(l => l.id === selectedLeague)?.name;
    const matchesStatus = selectedStatus === 'all' || match.status === selectedStatus;
    
    return matchesSearch && matchesLeague && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800';
      case 'finished': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleRefresh = () => {
    if (selectedLeague !== 'all') {
      fetchMatches(selectedLeague);
    }
    fetchLiveMatches();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Football Data</h1>
          <p className="text-gray-600 mt-1">
            Live matches, statistics, and comprehensive football data from multiple sources
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Leagues</p>
                <p className="text-2xl font-bold">{leagues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Live Matches</p>
                <p className="text-2xl font-bold">{liveMatches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold">{matches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Data Sources</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Matches Section */}
      {liveMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-red-600" />
              <span>Live Matches</span>
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            </CardTitle>
            <CardDescription>
              Currently live matches with real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match) => (
                <Card key={match.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getStatusColor(match.status)}>
                        {match.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {match.source}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{match.homeTeam}</span>
                        <span className="text-2xl font-bold">{match.homeScore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{match.awayTeam}</span>
                        <span className="text-2xl font-bold">{match.awayScore}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                      {formatDate(match.date)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Match Filters</CardTitle>
          <CardDescription>
            Filter matches by league, status, and search terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search teams or competitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">League</label>
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger>
                  <SelectValue placeholder="Select league" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {leagues.map((league) => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name} ({league.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Matches</span>
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            {selectedLeague === 'all' 
              ? 'Select a league to view matches' 
              : `Showing ${filteredMatches.length} matches from ${leagues.find(l => l.id === selectedLeague)?.name}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {selectedLeague === 'all' ? (
            <div className="text-center py-8 text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a league from the filter above to view matches</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600" />
              <p className="mt-2 text-gray-600">Loading matches...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No matches found for the selected criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(match.status)}>
                              {match.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {match.source}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(match.date)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div className="text-right">
                            <p className="font-medium">{match.homeTeam}</p>
                            {match.homeScore !== undefined && (
                              <p className="text-2xl font-bold">{match.homeScore}</p>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-gray-500">vs</p>
                            {match.odds && (
                              <div className="text-xs text-gray-400 mt-1">
                                <p>H: {match.odds.home}</p>
                                <p>D: {match.odds.draw}</p>
                                <p>A: {match.odds.away}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-left">
                            <p className="font-medium">{match.awayTeam}</p>
                            {match.awayScore !== undefined && (
                              <p className="text-2xl font-bold">{match.awayScore}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500">
                          {match.competition}
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

      {/* Data Sources Info */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Information about the football data providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium">ESPN API</p>
                <p className="text-sm text-gray-500">Live scores & statistics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">API-Football</p>
                <p className="text-sm text-gray-500">Comprehensive data</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div>
                <p className="font-medium">Unified Data</p>
                <p className="text-sm text-gray-500">Merged sources</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 