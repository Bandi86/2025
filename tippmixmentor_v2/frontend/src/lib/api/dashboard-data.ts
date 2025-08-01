import { apiClient } from '../api-client';

export interface LiveMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  minute?: number
  status: 'live' | 'finished' | 'scheduled'
  confidence?: number
  league?: string
  matchTime?: string
  odds?: any
  venue?: string
}

export interface Prediction {
  id: string
  homeTeam: string
  awayTeam: string
  prediction: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW'
  confidence: number
  odds?: number
  stake?: number
  potentialWin?: number
  matchTime?: string
  league?: string
  status?: 'pending' | 'live' | 'won' | 'lost'
}

export interface StatData {
  title: string
  value: number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: 'trending' | 'target' | 'dollar' | 'users' | 'activity'
  format?: 'percentage' | 'currency' | 'number' | 'text'
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
}

export interface AgentData {
  id: string
  name: string
  type: 'prediction' | 'analysis' | 'monitoring' | 'insight'
  status: 'online' | 'offline' | 'busy' | 'error'
  accuracy: number
  predictionsMade: number
  lastActivity: string
  performance?: {
    successRate: number
    avgResponseTime: number
    uptime: number
  }
  currentTask?: string
}

export class DashboardDataService {
  // Fetch live matches from ESPN API
  static async getLiveMatches(): Promise<LiveMatch[]> {
    try {
      console.log('[DashboardDataService] Fetching live matches...');
      
      // First try to get live matches from ESPN
      const espnResponse = await apiClient.getESPNLiveMatches();
      console.log('[DashboardDataService] ESPN live matches response:', espnResponse);
      
      if (espnResponse.success && espnResponse.data.matches && espnResponse.data.matches.length > 0) {
        const matches = espnResponse.data.matches.map((match: any) => ({
          id: match.id,
          homeTeam: match.homeTeam?.name || match.homeTeam,
          awayTeam: match.awayTeam?.name || match.awayTeam,
          homeScore: match.score?.fullTime?.home,
          awayScore: match.score?.fullTime?.away,
          minute: match.minute,
          status: match.status === 'LIVE' ? 'live' : 
                 match.status === 'FINISHED' ? 'finished' : 'scheduled',
          league: match.competition?.name,
          matchTime: match.utcDate,
          odds: match.odds,
          venue: match.venue?.name
        }));
        console.log('[DashboardDataService] Processed ESPN live matches:', matches);
        return matches;
      }

      // If no live matches, get upcoming matches from Premier League
      console.log('[DashboardDataService] No live matches, fetching Premier League scoreboard...');
      const scoreboardResponse = await apiClient.getESPNScoreboard('eng.1');
      console.log('[DashboardDataService] Scoreboard response:', scoreboardResponse);
      
      if (scoreboardResponse.success && scoreboardResponse.data.events) {
        const matches = scoreboardResponse.data.events.slice(0, 6).map((event: any) => {
          const homeTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home');
          const awayTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away');
          
          return {
            id: event.id,
            homeTeam: homeTeam?.team?.displayName || homeTeam?.team?.name || 'Unknown',
            awayTeam: awayTeam?.team?.displayName || awayTeam?.team?.name || 'Unknown',
            homeScore: parseInt(homeTeam?.score) || 0,
            awayScore: parseInt(awayTeam?.score) || 0,
            minute: event.competitions?.[0]?.status?.clock || 0,
            status: event.competitions?.[0]?.status?.type?.state === 'in' ? 'live' : 
                   event.competitions?.[0]?.status?.type?.state === 'post' ? 'finished' : 'scheduled',
            league: 'Premier League',
            matchTime: event.date,
            odds: event.competitions?.[0]?.odds?.[0],
            venue: event.competitions?.[0]?.venue?.fullName
          };
        });
        console.log('[DashboardDataService] Processed scoreboard matches:', matches);
        return matches;
      }

      console.log('[DashboardDataService] No matches found, returning empty array');
      return [];
    } catch (error) {
      console.error('[DashboardDataService] Error fetching live matches:', error);
      return [];
    }
  }

  // Fetch recent predictions from analytics endpoint
  static async getRecentPredictions(): Promise<Prediction[]> {
    try {
      console.log('[DashboardDataService] Fetching predictions from analytics...');
      
      // Try to get predictions from analytics endpoint
      const response = await apiClient.getAnalytics();
      console.log('[DashboardDataService] Analytics response:', response);
      
      if (response && Array.isArray(response)) {
        const predictions = response.map((pred: any) => ({
          id: pred.matchId,
          homeTeam: pred.homeTeam,
          awayTeam: pred.awayTeam,
          prediction: pred.prediction === 'home' ? 'HOME_WIN' : 
                     pred.prediction === 'away' ? 'AWAY_WIN' : 'DRAW',
          confidence: pred.confidence * 100,
          odds: pred.odds,
          stake: pred.stake,
          potentialWin: pred.return,
          matchTime: pred.date,
          league: pred.league,
          status: pred.isCorrect ? 'won' : 'lost'
        }));
        console.log('[DashboardDataService] Processed analytics predictions:', predictions);
        return predictions;
      }

      // Return mock predictions based on upcoming matches
      console.log('[DashboardDataService] No predictions from analytics, generating mock predictions...');
      const upcomingMatches = await this.getLiveMatches();
      const predictions = upcomingMatches.slice(0, 4).map((match, index) => ({
        id: `pred-${match.id}`,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        prediction: ['HOME_WIN', 'AWAY_WIN', 'DRAW'][index % 3] as 'HOME_WIN' | 'AWAY_WIN' | 'DRAW',
        confidence: 65 + (index * 5),
        odds: 1.5 + (index * 0.2),
        stake: 10,
        potentialWin: 15 + (index * 2),
        matchTime: match.matchTime,
        league: match.league,
        status: 'pending'
      }));
      console.log('[DashboardDataService] Generated mock predictions:', predictions);
      return predictions;
    } catch (error) {
      console.error('[DashboardDataService] Error fetching predictions:', error);
      return [];
    }
  }

  // Fetch dashboard statistics
  static async getDashboardStats(): Promise<StatData[]> {
    try {
      console.log('[DashboardDataService] Fetching dashboard stats...');
      
      // Get live matches count
      const liveMatches = await this.getLiveMatches();
      const liveCount = liveMatches.filter(m => m.status === 'live').length;
      const upcomingCount = liveMatches.filter(m => m.status === 'scheduled').length;
      
      // Get predictions count
      const predictions = await this.getRecentPredictions();
      
      const stats = [
        {
          title: "Live Matches",
          value: liveCount,
          change: 2,
          changeType: "increase",
          icon: "activity",
          color: "blue",
          format: "number"
        },
        {
          title: "Upcoming Matches",
          value: upcomingCount,
          change: 5,
          changeType: "increase",
          icon: "target",
          color: "green",
          format: "number"
        },
        {
          title: "Active Predictions",
          value: predictions.length,
          change: 3,
          changeType: "increase",
          icon: "trending",
          color: "orange",
          format: "number"
        },
        {
          title: "Success Rate",
          value: 78.5,
          change: 2.3,
          changeType: "increase",
          icon: "trending",
          color: "purple",
          format: "percentage"
        }
      ];
      
      console.log('[DashboardDataService] Generated stats:', stats);
      return stats;
    } catch (error) {
      console.error('[DashboardDataService] Error fetching dashboard stats:', error);
      return [];
    }
  }

  // Fetch agent status (mock data since agents endpoint requires auth)
  static async getAgentStatus(): Promise<AgentData[]> {
    try {
      console.log('[DashboardDataService] Fetching agent status...');
      
      // Try to get agents from backend (will likely fail due to auth)
      try {
        const response = await apiClient.getAgents();
        console.log('[DashboardDataService] Agents response:', response);
        
        if (response && response.agents) {
          const agents = response.agents.map((agent: any) => ({
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
            accuracy: agent.accuracy || 0,
            predictionsMade: agent.predictionsMade || 0,
            lastActivity: agent.lastActivity || new Date().toISOString(),
            performance: agent.performance,
            currentTask: agent.currentTask
          }));
          console.log('[DashboardDataService] Processed agents:', agents);
          return agents;
        }
      } catch (authError) {
        console.log('[DashboardDataService] Agents endpoint requires auth, using mock data');
      }

      // Return enhanced mock agent data
      console.log('[DashboardDataService] Using mock agents...');
      const agents = [
        {
          id: 'agent-1',
          name: 'Prediction Agent',
          type: 'prediction',
          status: 'online',
          accuracy: 78.5,
          predictionsMade: 1247,
          lastActivity: new Date().toISOString(),
          performance: {
            successRate: 78.5,
            avgResponseTime: 2.3,
            uptime: 99.8
          },
          currentTask: 'Analyzing Liverpool vs Bournemouth'
        },
        {
          id: 'agent-2',
          name: 'Analysis Agent',
          type: 'analysis',
          status: 'online',
          accuracy: 82.1,
          predictionsMade: 892,
          lastActivity: new Date().toISOString(),
          performance: {
            successRate: 82.1,
            avgResponseTime: 1.8,
            uptime: 99.9
          },
          currentTask: 'Processing team statistics'
        },
        {
          id: 'agent-3',
          name: 'Monitoring Agent',
          type: 'monitoring',
          status: 'busy',
          accuracy: 75.3,
          predictionsMade: 1563,
          lastActivity: new Date().toISOString(),
          performance: {
            successRate: 75.3,
            avgResponseTime: 0.5,
            uptime: 99.7
          },
          currentTask: 'Tracking live match events'
        },
        {
          id: 'agent-4',
          name: 'Insight Agent',
          type: 'insight',
          status: 'online',
          accuracy: 85.2,
          predictionsMade: 734,
          lastActivity: new Date().toISOString(),
          performance: {
            successRate: 85.2,
            avgResponseTime: 3.1,
            uptime: 99.6
          },
          currentTask: 'Generating betting insights'
        }
      ];
      console.log('[DashboardDataService] Generated mock agents:', agents);
      return agents;
    } catch (error) {
      console.error('[DashboardDataService] Error fetching agent status:', error);
      return [];
    }
  }

  // Get all dashboard data in one call
  static async getAllDashboardData() {
    try {
      console.log('[DashboardDataService] Getting all dashboard data...');
      
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        this.getLiveMatches(),
        this.getRecentPredictions(),
        this.getDashboardStats(),
        this.getAgentStatus()
      ]);
      
      console.log('[DashboardDataService] All data results:', results);
      
      const [liveMatches, predictions, stats, agents] = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`[DashboardDataService] Error in data fetch ${index}:`, result.reason);
          return [];
        }
      });

      const allData = {
        liveMatches,
        predictions,
        stats,
        agents
      };
      
      console.log('[DashboardDataService] Final all data:', allData);
      return allData;
    } catch (error) {
      console.error('[DashboardDataService] Error fetching dashboard data:', error);
      return {
        liveMatches: [],
        predictions: [],
        stats: [],
        agents: []
      };
    }
  }
} 