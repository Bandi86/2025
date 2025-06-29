'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, type Match, type Statistics } from '@/lib/api';
import { RefreshCw, TrendingUp, Calendar, FileText, Users, Target } from 'lucide-react';
import SortDropdown from '@/components/SortDropdown';
import MatchCard from '@/components/MatchCard';

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<'time' | 'team' | 'id'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = async (currentSortBy = sortBy, currentSortOrder = sortOrder) => {
    try {
      setLoading(true);
      setError(null);

      const [matchesData, statsData] = await Promise.all([
        apiClient.getMatches({
          limit: 20,
          sort_by: currentSortBy,
          sort_order: currentSortOrder,
        }),
        apiClient.getStatistics(),
      ]);

      setMatches(matchesData.matches);
      setStatistics(statsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Váratlan hiba történt');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy as 'time' | 'team' | 'id');
    setSortOrder(newSortOrder);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (matches.length > 0) {
      // Only refetch if we already have data
      fetchData(sortBy, sortOrder);
    }
  }, [sortBy, sortOrder]);

  const formatOdds = (odds?: number) => {
    return odds ? odds.toFixed(2) : 'N/A';
  };

  const getBetTypeBadgeVariant = (betType: string) => {
    switch (betType) {
      case 'main':
        return 'default';
      case 'goal':
        return 'secondary';
      case 'corner':
        return 'outline';
      case 'card':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">⚠️ Hiba történt</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Újrapróbálás
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">🏆 SportFogadás Dashboard</h1>
          <p className="text-muted-foreground">
            Modern sport fogadási adatok Next.js 15 és Shadcn UI-val
          </p>
        </div>
        <div className="text-right">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Frissítés
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Utolsó frissítés: {lastUpdated.toLocaleTimeString('hu-HU')}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Összes Meccs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_matches}</div>
              <p className="text-xs text-muted-foreground">
                +{statistics.total_matches} az utolsó importálás óta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fogadási Opciók</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_betting_options}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.avg_bets_per_match.toFixed(1)} átlag/meccs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PDF Források</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.unique_sources}</div>
              <p className="text-xs text-muted-foreground">Feldolgozott fájlok</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Népszerű Nap</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.match_days[0]?.match_day || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.match_days[0]?.count || 0} meccs
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Matches Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Legutóbbi Meccsek ({matches.length})
              </CardTitle>
              <CardDescription>A legfrissebb sport meccsek és fogadási lehetőségek</CardDescription>
            </div>

            <SortDropdown
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              disabled={loading}
            />
          </div>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nincsenek elérhető meccsek</p>
              <p className="text-sm">Töltsön fel PDF fájlokat az importáláshoz</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  getBetTypeBadgeVariant={getBetTypeBadgeVariant}
                  formatOdds={formatOdds}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Betting Types Distribution */}
      {statistics && statistics.bet_types.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fogadási Típusok Eloszlása</CardTitle>
            <CardDescription>A különböző fogadási típusok megoszlása</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.bet_types.map((betType) => (
                <div key={betType.bet_type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getBetTypeBadgeVariant(betType.bet_type)}>
                      {betType.bet_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{betType.count}</div>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(betType.count / statistics.total_betting_options) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
