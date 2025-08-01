'use client';

import React from 'react';
import { useLiveMatches } from '@/hooks/use-dashboard-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  Target, 
  TrendingUp,
  Users,
  Globe,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  status: 'live' | 'finished' | 'scheduled';
  league?: string;
  matchTime?: string;
  odds?: any;
  venue?: string;
}

export function LiveMatchesDashboard() {
  const { matches, loading, error } = useLiveMatches(30000);

  // Calculate stats from real data
  const liveMatchesCount = matches.filter(m => m.status === 'live').length;
  const scheduledCount = matches.filter(m => m.status === 'scheduled').length;
  const competitionsCount = new Set(matches.map(m => m.league || 'Unknown')).size;
  const totalGoals = matches.reduce((acc, m) => acc + (m.homeScore || 0) + (m.awayScore || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading live matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600">Error loading matches: {error}</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finished':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Activity className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'finished':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Live Matches</p>
                <p className="text-2xl font-bold text-red-600">{liveMatchesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Competitions</p>
                <p className="text-2xl font-bold text-green-600">{competitionsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Goals</p>
                <p className="text-2xl font-bold text-purple-600">{totalGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Live Matches ({matches.length})</span>
          </CardTitle>
          <CardDescription>
            Real-time match data with live scores and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No matches available at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(match.status)}
                      <Badge className={getStatusColor(match.status)}>
                        {match.status.toUpperCase()}
                      </Badge>
                      {match.league && (
                        <Badge variant="outline" className="text-xs">
                          {match.league}
                        </Badge>
                      )}
                    </div>
                    {match.matchTime && (
                      <span className="text-sm text-gray-500">
                        {new Date(match.matchTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-lg">{match.homeTeam}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {match.homeScore || 0} - {match.awayScore || 0}
                      </div>
                      {match.minute && match.status === 'live' && (
                        <div className="text-sm text-red-600 font-medium">
                          {match.minute}'
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-lg">{match.awayTeam}</p>
                    </div>
                  </div>

                  {match.odds && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-center space-x-4 text-sm">
                        <span>1: {match.odds.homeTeamOdds?.value || 'N/A'}</span>
                        <span>X: {match.odds.drawOdds?.value || 'N/A'}</span>
                        <span>2: {match.odds.awayTeamOdds?.value || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 