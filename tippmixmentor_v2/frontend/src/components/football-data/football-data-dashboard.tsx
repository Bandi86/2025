'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Trophy, Users, Target, Calendar } from 'lucide-react';

interface Match {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    fullTime: { home: number; away: number };
  };
}

interface Standing {
  position: number;
  team: { name: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface Scorer {
  player: { name: string };
  team: { name: string };
  goals: number;
  assists: number;
}

interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

interface FootballDataStatus {
  status: string;
  message: string;
  last_updated: string;
  competitions: Array<{
    competition: string;
    name: string;
    files: Array<{
      type: string;
      exists: boolean;
      size_mb: number;
    }>;
  }>;
}

const competitions = [
  { code: 'PL', name: 'Premier League' },
  { code: 'CL', name: 'Champions League' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'PD', name: 'La Liga' },
  { code: 'FL1', name: 'Ligue 1' },
];

export default function FootballDataDashboard() {
  const [status, setStatus] = useState<FootballDataStatus | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState('PL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/football-data/status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError('Failed to fetch data status');
    }
  };

  const fetchMatches = async (competition: string) => {
    try {
      const response = await fetch(`/api/football-data/matches?competition=${competition}&limit=20`);
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      setError('Failed to fetch matches');
    }
  };

  const fetchStandings = async (competition: string) => {
    try {
      const response = await fetch(`/api/football-data/standings/${competition}`);
      const data = await response.json();
      setStandings(data.standings || []);
    } catch (err) {
      setError('Failed to fetch standings');
    }
  };

  const fetchScorers = async (competition: string) => {
    try {
      const response = await fetch(`/api/football-data/scorers/${competition}?limit=10`);
      const data = await response.json();
      setScorers(data.scorers || []);
    } catch (err) {
      setError('Failed to fetch scorers');
    }
  };

  const fetchTeams = async (competition: string) => {
    try {
      const response = await fetch(`/api/football-data/teams/${competition}`);
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      setError('Failed to fetch teams');
    }
  };

  const loadData = async (competition: string) => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      fetchMatches(competition),
      fetchStandings(competition),
      fetchScorers(competition),
      fetchTeams(competition),
    ]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    loadData(selectedCompetition);
  }, [selectedCompetition]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'incomplete': return 'bg-yellow-100 text-yellow-800';
      case 'missing': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'FINISHED': return 'bg-gray-100 text-gray-800';
      case 'LIVE': return 'bg-red-100 text-red-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Football Data Dashboard</h1>
          <p className="text-gray-600">Real-time football data from Football-Data.org</p>
        </div>
        <Button onClick={() => loadData(selectedCompetition)} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Status Card */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Data Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(status.status)}>
                {status.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">{status.message}</span>
              {status.last_updated && (
                <span className="text-sm text-gray-500">
                  Last updated: {formatDate(status.last_updated)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Competition Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Competition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {competitions.map((comp) => (
              <Button
                key={comp.code}
                variant={selectedCompetition === comp.code ? 'default' : 'outline'}
                onClick={() => setSelectedCompetition(comp.code)}
                disabled={loading}
              >
                {comp.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Tabs */}
      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="standings" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Standings
          </TabsTrigger>
          <TabsTrigger value="scorers" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Top Scorers
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : matches.length > 0 ? (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge className={getMatchStatusColor(match.status)}>
                          {match.status}
                        </Badge>
                        <span className="font-medium">{match.homeTeam.name}</span>
                        <span className="text-gray-500">vs</span>
                        <span className="font-medium">{match.awayTeam.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {match.score.fullTime.home} - {match.score.fullTime.away}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(match.utcDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No matches available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>League Table</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Pos</th>
                        <th className="text-left p-2">Team</th>
                        <th className="text-center p-2">P</th>
                        <th className="text-center p-2">W</th>
                        <th className="text-center p-2">D</th>
                        <th className="text-center p-2">L</th>
                        <th className="text-center p-2">GF</th>
                        <th className="text-center p-2">GA</th>
                        <th className="text-center p-2">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team) => (
                        <tr key={team.position} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{team.position}</td>
                          <td className="p-2">{team.team.name}</td>
                          <td className="p-2 text-center">{team.playedGames}</td>
                          <td className="p-2 text-center">{team.won}</td>
                          <td className="p-2 text-center">{team.draw}</td>
                          <td className="p-2 text-center">{team.lost}</td>
                          <td className="p-2 text-center">{team.goalsFor}</td>
                          <td className="p-2 text-center">{team.goalsAgainst}</td>
                          <td className="p-2 text-center font-bold">{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No standings available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scorers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Scorers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : scorers.length > 0 ? (
                <div className="space-y-3">
                  {scorers.map((scorer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{scorer.player.name}</div>
                          <div className="text-sm text-gray-500">{scorer.team.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{scorer.goals} goals</div>
                        <div className="text-sm text-gray-500">{scorer.assists} assists</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No scorers available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <div key={team.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {team.crest && (
                          <img src={team.crest} alt={team.name} className="w-8 h-8" />
                        )}
                        <div>
                          <div className="font-medium">{team.name}</div>
                          <div className="text-sm text-gray-500">{team.shortName}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No teams available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 