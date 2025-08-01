import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { ESPNFootballService } from './espn-football.service';
import { UnifiedFootballService } from './unified-football.service';

export interface OddsComparison {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTime: string;
  providers: Array<{
    name: string;
    homeOdds: number;
    awayOdds: number;
    drawOdds?: number;
    overUnder?: number;
    lastUpdated: string;
  }>;
  bestOdds: {
    home: { provider: string; odds: number };
    away: { provider: string; odds: number };
    draw?: { provider: string; odds: number };
  };
  valueBets: Array<{
    type: 'home' | 'away' | 'draw' | 'over' | 'under';
    provider: string;
    odds: number;
    value: number;
    confidence: number;
  }>;
  marketEfficiency: number;
  lastUpdated: string;
}

export interface BettingRecommendation {
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

@Injectable()
export class OddsAnalysisService {
  private readonly logger = new Logger(OddsAnalysisService.name);
  private readonly cacheTtl = 300; // 5 minutes

  constructor(
    private readonly espnFootballService: ESPNFootballService,
    private readonly unifiedFootballService: UnifiedFootballService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getOddsComparison(matchId: string): Promise<OddsComparison> {
    const cacheKey = `odds_comparison:${matchId}`;
    
    try {
      // Check cache first
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get match details
      const match = await this.getMatchDetails(matchId);
      if (!match) {
        throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
      }

      // Get odds from multiple sources (mock data for now)
      const oddsData = await this.getMultiSourceOdds(matchId, 'PL');
      
      // Analyze odds and find best values
      const analysis = this.analyzeOdds(oddsData);
      
      // Calculate market efficiency
      const marketEfficiency = this.calculateMarketEfficiency(oddsData);
      
      // Find value bets
      const valueBets = this.findValueBets(oddsData, analysis);
      
      const result: OddsComparison = {
        matchId,
        homeTeam: match.homeTeam?.name || 'Unknown',
        awayTeam: match.awayTeam?.name || 'Unknown',
        league: match.league?.name || 'Unknown',
        matchTime: match.matchDate?.toISOString() || new Date().toISOString(),
        providers: oddsData,
        bestOdds: analysis.bestOdds,
        valueBets,
        marketEfficiency,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      await this.redisService.set(cacheKey, JSON.stringify(result), this.cacheTtl);
      
      return result;
    } catch (error) {
      this.logger.error(`Error getting odds comparison for ${matchId}: ${error.message}`);
      throw error;
    }
  }

  async getBettingRecommendations(leagueCode?: string): Promise<BettingRecommendation[]> {
    const cacheKey = `betting_recommendations:${leagueCode || 'all'}`;
    
    try {
      // Check cache first
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get upcoming matches
      const matches = await this.getUpcomingMatches(leagueCode);
      const recommendations: BettingRecommendation[] = [];

      for (const match of matches) {
        try {
          const recommendation = await this.generateRecommendation(match);
          if (recommendation) {
            recommendations.push(recommendation);
          }
        } catch (error) {
          this.logger.warn(`Error generating recommendation for ${match.id}: ${error.message}`);
        }
      }

      // Sort by confidence and value
      recommendations.sort((a, b) => {
        const scoreA = a.confidence * a.odds.value;
        const scoreB = b.confidence * b.odds.value;
        return scoreB - scoreA;
      });

      // Cache the result
      await this.redisService.set(cacheKey, JSON.stringify(recommendations), this.cacheTtl);
      
      return recommendations;
    } catch (error) {
      this.logger.error(`Error getting betting recommendations: ${error.message}`);
      throw error;
    }
  }

  private async getMatchDetails(matchId: string) {
    // Get match from database or API
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
    });

    if (!match) {
      // Try to get from API
      const liveMatches = await this.espnFootballService.getLiveMatches();
      const liveMatch = liveMatches.find(m => m.id === matchId);
      
      if (liveMatch) {
        const competition = liveMatch.competitions?.[0];
        const homeTeam = competition?.competitors?.find(c => c.homeAway === 'home')?.team;
        const awayTeam = competition?.competitors?.find(c => c.homeAway === 'away')?.team;
        
        return {
          id: matchId,
          homeTeam: { name: homeTeam?.displayName || 'Unknown' },
          awayTeam: { name: awayTeam?.displayName || 'Unknown' },
          league: { name: competition?.id || 'unknown' },
          matchDate: new Date(liveMatch.date),
        };
      }
    }

    return match;
  }

  private async getMultiSourceOdds(matchId: string, league: string) {
    const odds = [];
    
    try {
      // Get ESPN odds
      const espnOdds = await this.espnFootballService.getMatchOdds(matchId, league, league);
      odds.push(...espnOdds.map(odd => ({
        name: odd.provider,
        homeOdds: odd.homeOdds,
        awayOdds: odd.awayOdds,
        drawOdds: odd.drawOdds,
        overUnder: odd.overUnder,
        lastUpdated: new Date().toISOString(),
      })));
    } catch (error) {
      this.logger.warn(`Error getting ESPN odds for ${matchId}: ${error.message}`);
    }

    // Add mock data for testing
    odds.push({
      name: 'Mock Provider 1',
      homeOdds: 2.1,
      awayOdds: 3.2,
      drawOdds: 3.0,
      overUnder: 2.5,
      lastUpdated: new Date().toISOString(),
    });

    odds.push({
      name: 'Mock Provider 2',
      homeOdds: 2.0,
      awayOdds: 3.5,
      drawOdds: 2.8,
      overUnder: 2.5,
      lastUpdated: new Date().toISOString(),
    });

    return odds;
  }

  private analyzeOdds(oddsData: any[]) {
    const bestOdds = {
      home: { provider: '', odds: 0 },
      away: { provider: '', odds: 0 },
      draw: { provider: '', odds: 0 },
    };

    for (const odds of oddsData) {
      if (odds.homeOdds > bestOdds.home.odds) {
        bestOdds.home = { provider: odds.name, odds: odds.homeOdds };
      }
      if (odds.awayOdds > bestOdds.away.odds) {
        bestOdds.away = { provider: odds.name, odds: odds.awayOdds };
      }
      if (odds.drawOdds && odds.drawOdds > bestOdds.draw.odds) {
        bestOdds.draw = { provider: odds.name, odds: odds.drawOdds };
      }
    }

    return { bestOdds };
  }

  private findValueBets(oddsData: any[], analysis: any) {
    const valueBets = [];
    const averageOdds = this.calculateAverageOdds(oddsData);

    for (const odds of oddsData) {
      // Check home odds value
      if (odds.homeOdds > averageOdds.home * 1.1) {
        valueBets.push({
          type: 'home' as const,
          provider: odds.name,
          odds: odds.homeOdds,
          value: ((odds.homeOdds - averageOdds.home) / averageOdds.home) * 100,
          confidence: this.calculateConfidence(oddsData.length, odds.name),
        });
      }

      // Check away odds value
      if (odds.awayOdds > averageOdds.away * 1.1) {
        valueBets.push({
          type: 'away' as const,
          provider: odds.name,
          odds: odds.awayOdds,
          value: ((odds.awayOdds - averageOdds.away) / averageOdds.away) * 100,
          confidence: this.calculateConfidence(oddsData.length, odds.name),
        });
      }

      // Check draw odds value
      if (odds.drawOdds && odds.drawOdds > averageOdds.draw * 1.1) {
        valueBets.push({
          type: 'draw' as const,
          provider: odds.name,
          odds: odds.drawOdds,
          value: ((odds.drawOdds - averageOdds.draw) / averageOdds.draw) * 100,
          confidence: this.calculateConfidence(oddsData.length, odds.name),
        });
      }
    }

    return valueBets.sort((a, b) => b.value - a.value);
  }

  private calculateAverageOdds(oddsData: any[]) {
    const totals = { home: 0, away: 0, draw: 0, count: 0 };
    
    for (const odds of oddsData) {
      totals.home += odds.homeOdds;
      totals.away += odds.awayOdds;
      if (odds.drawOdds) totals.draw += odds.drawOdds;
      totals.count++;
    }

    return {
      home: totals.home / totals.count,
      away: totals.away / totals.count,
      draw: totals.draw / totals.count,
    };
  }

  private calculateMarketEfficiency(oddsData: any[]) {
    if (oddsData.length < 2) return 0;

    const variances = [];
    const averageOdds = this.calculateAverageOdds(oddsData);

    for (const odds of oddsData) {
      const homeVariance = Math.pow(odds.homeOdds - averageOdds.home, 2);
      const awayVariance = Math.pow(odds.awayOdds - averageOdds.away, 2);
      variances.push((homeVariance + awayVariance) / 2);
    }

    const averageVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
    const efficiency = Math.max(0, 100 - (averageVariance * 10));

    return Math.min(100, Math.max(0, efficiency));
  }

  private calculateConfidence(providerCount: number, providerName: string): number {
    const providerReputation = {
      'ESPN BET': 0.9,
      'Bet 365': 0.85,
      'William Hill': 0.8,
      'Ladbrokes': 0.8,
      'Paddy Power': 0.8,
    };

    const reputation = providerReputation[providerName] || 0.7;
    const dataQuality = Math.min(1, providerCount / 5);

    return (reputation + dataQuality) / 2;
  }

  private async getUpcomingMatches(leagueCode?: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        matchDate: {
          gte: new Date(),
        },
        ...(leagueCode && { leagueId: leagueCode }),
      },
      orderBy: { matchDate: 'asc' },
      take: 20,
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
    });

    return matches;
  }

  private async generateRecommendation(match: any): Promise<BettingRecommendation | null> {
    try {
      const oddsComparison = await this.getOddsComparison(match.id);
      
      if (oddsComparison.valueBets.length === 0) {
        return null;
      }

      const bestValueBet = oddsComparison.valueBets[0];
      const confidence = this.calculateRecommendationConfidence(oddsComparison, bestValueBet);
      const reasoning = this.generateReasoning(oddsComparison, bestValueBet);
      const risk = this.determineRiskLevel(confidence, bestValueBet.value);
      const stake = this.calculateRecommendedStake(confidence, risk, bestValueBet.value);

      return {
        matchId: match.id,
        homeTeam: match.homeTeam?.name || 'Unknown',
        awayTeam: match.awayTeam?.name || 'Unknown',
        league: match.league?.name || 'Unknown',
        recommendation: bestValueBet.type,
        confidence,
        reasoning,
        odds: {
          recommended: bestValueBet.odds,
          average: this.getAverageOddsForType(oddsComparison, bestValueBet.type),
          value: bestValueBet.value,
        },
        risk,
        stake,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn(`Error generating recommendation for ${match.id}: ${error.message}`);
      return null;
    }
  }

  private calculateRecommendationConfidence(oddsComparison: OddsComparison, valueBet: any): number {
    const marketEfficiency = oddsComparison.marketEfficiency / 100;
    const valueStrength = Math.min(1, valueBet.value / 20);
    const providerConfidence = valueBet.confidence;
    
    return (marketEfficiency + valueStrength + providerConfidence) / 3;
  }

  private generateReasoning(oddsComparison: OddsComparison, valueBet: any): string[] {
    const reasoning = [];
    
    reasoning.push(`Best ${valueBet.type} odds available at ${valueBet.provider}`);
    reasoning.push(`${valueBet.value.toFixed(1)}% value compared to market average`);
    
    if (oddsComparison.marketEfficiency > 80) {
      reasoning.push('High market efficiency indicates reliable odds');
    }
    
    if (valueBet.confidence > 0.8) {
      reasoning.push('High confidence in odds accuracy');
    }
    
    return reasoning;
  }

  private determineRiskLevel(confidence: number, value: number): 'low' | 'medium' | 'high' {
    if (confidence > 0.8 && value > 15) return 'low';
    if (confidence > 0.6 && value > 10) return 'medium';
    return 'high';
  }

  private calculateRecommendedStake(confidence: number, risk: string, value: number): number {
    const baseStake = 2;
    
    const confidenceMultiplier = confidence;
    const valueMultiplier = Math.min(2, value / 10);
    const riskMultiplier = risk === 'low' ? 1.5 : risk === 'medium' ? 1 : 0.5;
    
    return Math.min(10, baseStake * confidenceMultiplier * valueMultiplier * riskMultiplier);
  }

  private getAverageOddsForType(oddsComparison: OddsComparison, type: string): number {
    const relevantOdds = oddsComparison.providers
      .map(p => p[`${type}Odds`])
      .filter(odds => odds !== undefined);
    
    if (relevantOdds.length === 0) return 0;
    
    return relevantOdds.reduce((a, b) => a + b, 0) / relevantOdds.length;
  }
} 