'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  BarChart3,
  Zap,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react';

interface BettingRecommendation {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  recommendation: 'home' | 'away' | 'draw' | 'over' | 'under' | 'avoid';
  confidence: number;
  reasoning: string[];
  odds: {
    recommended: number;
    average: number;
    value: number;
  };
  risk: 'low' | 'medium' | 'high';
  stake: number;
  lastUpdated: string;
}

interface ValueBet {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  type: string;
  provider: string;
  odds: number;
  value: number;
  confidence: number;
}

interface OddsMovementAlert {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  movement: {
    type: 'home' | 'away' | 'draw' | 'over' | 'under';
    direction: 'up' | 'down';
    percentage: number;
    provider: string;
  };
  significance: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface BettingRecommendationsDashboardProps {
  className?: string;
}

const LEAGUES = [
  { code: 'all', name: 'All Leagues' },
  { code: 'PL', name: 'Premier League' },
  { code: 'PD', name: 'La Liga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'FL1', name: 'Ligue 1' },
  { code: 'CL', name: 'Champions League' },
  { code: 'EL', name: 'Europa League' },
];

export const BettingRecommendationsDashboard: React.FC<BettingRecommendationsDashboardProps> = ({ className }) => {
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [recommendations, setRecommendations] = useState<BettingRecommendation[]>([]);
  const [valueBets, setValueBets] = useState<ValueBet[]>([]);
  const [movementAlerts, setMovementAlerts] = useState<OddsMovementAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch data
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const leagueParam = selectedLeague === 'all' ? '' : `?league=${selectedLeague}`;
      const response = await fetch(`/api/odds-analysis/recommendations${leagueParam}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
        setLastUpdated(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchValueBets = async () => {
    try {
      const response = await fetch('/api/odds-analysis/top-value-bets?limit=20&minValue=10');
      if (response.ok) {
        const data = await response.json();
        setValueBets(data);
      }
    } catch (error) {
      console.error('Error fetching value bets:', error);
    }
  };

  const fetchMovementAlerts = async () => {
    try {
      const response = await fetch('/api/odds-analysis/movement-alerts');
      if (response.ok) {
        const data = await response.json();
        setMovementAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching movement alerts:', error);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchValueBets();
    fetchMovementAlerts();
  }, [selectedLeague]);

  // Get recommendation icon
  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'home':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'away':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'draw':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'over':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'under':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'avoid':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get value color
  const getValueColor = (value: number) => {
    if (value >= 20) return 'text-green-600 font-bold';
    if (value >= 10) return 'text-yellow-600 font-semibold';
    return 'text-red-600';
  };

  // Format odds
  const formatOdds = (odds: number) => {
    return odds.toFixed(2);
  };

  // Format stake
  const formatStake = (stake: number) => {
    return `${stake.toFixed(1)}%`;
  };

  // Get movement icon
  const getMovementIcon = (direction: string) => {
    return direction === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Get significance color
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Betting Recommendations</h2>
            <Badge variant="outline">
              {recommendations.length} recommendations
            </Badge>
          </div>
          
          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select league" />
            </SelectTrigger>
            <SelectContent>
              {LEAGUES.map((league) => (
                <SelectItem key={league.code} value={league.code}>
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={fetchRecommendations} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="value-bets">Value Bets</TabsTrigger>
          <TabsTrigger value="movement-alerts">Odds Movements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>Loading recommendations...</p>
                </div>
              </CardContent>
            </Card>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No betting recommendations available</p>
                  <p className="text-sm">Try selecting a different league or check back later</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.matchId} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    {/* Match Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {getRecommendationIcon(rec.recommendation)}
                        <div>
                          <div className="font-semibold">
                            {rec.homeTeam} vs {rec.awayTeam}
                          </div>
                          <div className="text-sm text-muted-foreground">{rec.league}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskColor(rec.risk)}>
                          {rec.risk.toUpperCase()} RISK
                        </Badge>
                        <Badge variant="outline">
                          {rec.recommendation.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Recommendation Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Recommended Odds</div>
                        <div className="text-2xl font-bold text-primary">
                          {formatOdds(rec.odds.recommended)}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Value</div>
                        <div className={`text-2xl font-bold ${getValueColor(rec.odds.value)}`}>
                          +{rec.odds.value.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Confidence</div>
                        <div className={`text-2xl font-bold ${getConfidenceColor(rec.confidence)}`}>
                          {(rec.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Confidence Level</span>
                        <span>{(rec.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={rec.confidence * 100} className="h-2" />
                    </div>

                    {/* Reasoning */}
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-2">Reasoning:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {rec.reasoning.map((reason, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Stake Recommendation */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Recommended Stake:</span>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatStake(rec.stake)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Value Bets Tab */}
        <TabsContent value="value-bets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Top Value Betting Opportunities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {valueBets.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No value betting opportunities found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Match</TableHead>
                        <TableHead>League</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Odds</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {valueBets.map((bet) => (
                        <TableRow key={`${bet.matchId}-${bet.type}`}>
                          <TableCell className="font-medium">
                            {bet.homeTeam} vs {bet.awayTeam}
                          </TableCell>
                          <TableCell>{bet.league}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{bet.type.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>{bet.provider}</TableCell>
                          <TableCell className="font-bold">
                            {formatOdds(bet.odds)}
                          </TableCell>
                          <TableCell className={getValueColor(bet.value)}>
                            +{bet.value.toFixed(1)}%
                          </TableCell>
                          <TableCell className={getConfidenceColor(bet.confidence)}>
                            {(bet.confidence * 100).toFixed(0)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movement Alerts Tab */}
        <TabsContent value="movement-alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Odds Movement Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movementAlerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No significant odds movements detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {movementAlerts.map((alert) => (
                    <div key={`${alert.matchId}-${alert.movement.type}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getMovementIcon(alert.movement.direction)}
                        <div>
                          <div className="font-medium">
                            {alert.homeTeam} vs {alert.awayTeam}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {alert.league} • {alert.movement.type.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getSignificanceColor(alert.significance)}>
                          {alert.significance.toUpperCase()}
                        </Badge>
                        <div className="text-right">
                          <div className="font-bold">
                            {alert.movement.percentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {alert.movement.provider}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Performance Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Recommendations</span>
                    <span className="font-bold">{recommendations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Confidence (&gt;80%)</span>
                    <span className="font-bold text-green-600">
                      {recommendations.filter(r => r.confidence > 0.8).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Value (&gt;20%)</span>
                    <span className="font-bold text-green-600">
                      {recommendations.filter(r => r.odds.value > 20).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Risk</span>
                    <span className="font-bold text-green-600">
                      {recommendations.filter(r => r.risk === 'low').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Risk Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Low Risk</span>
                    <span className="font-bold text-green-600">
                      {recommendations.filter(r => r.risk === 'low').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Risk</span>
                    <span className="font-bold text-yellow-600">
                      {recommendations.filter(r => r.risk === 'medium').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Risk</span>
                    <span className="font-bold text-red-600">
                      {recommendations.filter(r => r.risk === 'high').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 