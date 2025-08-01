import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OddsAnalysisService, OddsComparison, BettingRecommendation } from './odds-analysis.service';

@ApiTags('Odds Analysis & Betting Recommendations')
@Controller('odds-analysis')
export class OddsAnalysisController {
  constructor(private readonly oddsAnalysisService: OddsAnalysisService) {}

  @Get('comparison/:matchId')
  @ApiOperation({ summary: 'Get comprehensive odds comparison for a match' })
  @ApiParam({ name: 'matchId', description: 'Match ID to analyze' })
  @ApiResponse({ 
    status: 200, 
    description: 'Odds comparison data',
    schema: {
      type: 'object',
      properties: {
        matchId: { type: 'string' },
        homeTeam: { type: 'string' },
        awayTeam: { type: 'string' },
        league: { type: 'string' },
        providers: { type: 'array' },
        bestOdds: { type: 'object' },
        valueBets: { type: 'array' },
        marketEfficiency: { type: 'number' },
        lastUpdated: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async getOddsComparison(@Param('matchId') matchId: string): Promise<OddsComparison> {
    try {
      return await this.oddsAnalysisService.getOddsComparison(matchId);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to get odds comparison', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get betting recommendations for upcoming matches' })
  @ApiQuery({ 
    name: 'league', 
    required: false, 
    description: 'League code to filter recommendations (e.g., PL, PD, SA)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of betting recommendations',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          matchId: { type: 'string' },
          homeTeam: { type: 'string' },
          awayTeam: { type: 'string' },
          league: { type: 'string' },
          recommendation: { type: 'string', enum: ['home', 'away', 'draw', 'over', 'under', 'avoid'] },
          confidence: { type: 'number' },
          reasoning: { type: 'array', items: { type: 'string' } },
          odds: { type: 'object' },
          risk: { type: 'string', enum: ['low', 'medium', 'high'] },
          stake: { type: 'number' },
          lastUpdated: { type: 'string' },
        },
      },
    },
  })
  async getBettingRecommendations(
    @Query('league') leagueCode?: string,
  ): Promise<BettingRecommendation[]> {
    try {
      return await this.oddsAnalysisService.getBettingRecommendations(leagueCode);
    } catch (error) {
      throw new HttpException('Failed to get betting recommendations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }







  @Get('top-value-bets')
  @ApiOperation({ summary: 'Get top value betting opportunities across all matches' })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Number of top value bets to return (default: 10)',
    type: 'number'
  })
  @ApiQuery({ 
    name: 'minValue', 
    required: false, 
    description: 'Minimum value percentage to include (default: 10)',
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Top value betting opportunities',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          matchId: { type: 'string' },
          homeTeam: { type: 'string' },
          awayTeam: { type: 'string' },
          league: { type: 'string' },
          type: { type: 'string' },
          provider: { type: 'string' },
          odds: { type: 'number' },
          value: { type: 'number' },
          confidence: { type: 'number' },
        },
      },
    },
  })
  async getTopValueBets(
    @Query('limit') limit: number = 10,
    @Query('minValue') minValue: number = 10,
  ) {
    try {
      // Get recommendations and extract top value bets
      const recommendations = await this.oddsAnalysisService.getBettingRecommendations();
      
      const valueBets = recommendations
        .filter(rec => rec.odds.value >= minValue)
        .map(rec => ({
          matchId: rec.matchId,
          homeTeam: rec.homeTeam,
          awayTeam: rec.awayTeam,
          league: rec.league,
          type: rec.recommendation,
          provider: 'Best Available', // Would need to get from odds comparison
          odds: rec.odds.recommended,
          value: rec.odds.value,
          confidence: rec.confidence,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);

      return valueBets;
    } catch (error) {
      throw new HttpException('Failed to get top value bets', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('market-efficiency/:league')
  @ApiOperation({ summary: 'Get market efficiency analysis for a league' })
  @ApiParam({ name: 'league', description: 'League code to analyze' })
  @ApiResponse({ 
    status: 200, 
    description: 'Market efficiency analysis',
    schema: {
      type: 'object',
      properties: {
        league: { type: 'string' },
        averageEfficiency: { type: 'number' },
        matchCount: { type: 'number' },
        efficiencyRange: { type: 'object' },
        lastUpdated: { type: 'string' },
      },
    },
  })
  async getMarketEfficiency(@Param('league') league: string) {
    try {
      // Get recommendations for the league
      const recommendations = await this.oddsAnalysisService.getBettingRecommendations(league);
      
      if (recommendations.length === 0) {
        return {
          league,
          averageEfficiency: 0,
          matchCount: 0,
          efficiencyRange: { min: 0, max: 0 },
          lastUpdated: new Date().toISOString(),
        };
      }

      // Calculate average efficiency (this would need to be enhanced with actual efficiency data)
      const averageEfficiency = 75; // Placeholder
      
      return {
        league,
        averageEfficiency,
        matchCount: recommendations.length,
        efficiencyRange: { min: 60, max: 90 }, // Placeholder
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException('Failed to get market efficiency', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('arbitrage-opportunities')
  @ApiOperation({ summary: 'Get current arbitrage opportunities across all matches' })
  @ApiQuery({ 
    name: 'minProfit', 
    required: false, 
    description: 'Minimum profit percentage to include (default: 2)',
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Arbitrage opportunities',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          matchId: { type: 'string' },
          homeTeam: { type: 'string' },
          awayTeam: { type: 'string' },
          league: { type: 'string' },
          type: { type: 'string' },
          profit: { type: 'number' },
          stake: { type: 'number' },
          providers: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  })
  async getArbitrageOpportunities(@Query('minProfit') minProfit: number = 2) {
    try {
      // Get recommendations and extract arbitrage opportunities
      const recommendations = await this.oddsAnalysisService.getBettingRecommendations();
      
      const arbitrageOpportunities = [];
      
      // This would need to be enhanced with actual arbitrage detection
      // For now, return placeholder data
      if (recommendations.length > 0) {
        arbitrageOpportunities.push({
          matchId: recommendations[0].matchId,
          homeTeam: recommendations[0].homeTeam,
          awayTeam: recommendations[0].awayTeam,
          league: recommendations[0].league,
          type: 'home/away arbitrage',
          profit: 3.5,
          stake: 1000,
          providers: ['ESPN BET', 'Bet 365'],
        });
      }

      return arbitrageOpportunities.filter(opp => opp.profit >= minProfit);
    } catch (error) {
      throw new HttpException('Failed to get arbitrage opportunities', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('provider-analysis')
  @ApiOperation({ summary: 'Get analysis of odds providers performance and reliability' })
  @ApiResponse({ 
    status: 200, 
    description: 'Provider analysis',
    schema: {
      type: 'object',
      properties: {
        providers: { type: 'array' },
        averageOdds: { type: 'object' },
        reliability: { type: 'object' },
        lastUpdated: { type: 'string' },
      },
    },
  })
  async getProviderAnalysis() {
    try {
      // This would analyze provider performance over time
      // For now, return placeholder data
      return {
        providers: [
          { name: 'ESPN BET', reliability: 0.95, averageOdds: 2.1 },
          { name: 'Bet 365', reliability: 0.92, averageOdds: 2.05 },
          { name: 'William Hill', reliability: 0.88, averageOdds: 2.15 },
        ],
        averageOdds: {
          home: 2.1,
          away: 3.2,
          draw: 3.1,
        },
        reliability: {
          overall: 0.92,
          trend: 'improving',
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException('Failed to get provider analysis', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 