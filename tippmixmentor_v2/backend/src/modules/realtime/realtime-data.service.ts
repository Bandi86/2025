import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitterService } from '../../common/events/event-emitter.service';
import { LiveDataService } from '../live-data/live-data.service';
import { ApiFootballService } from '../football-data/api-football.service';
import { UnifiedFootballService } from '../football-data/unified-football.service';
import { AgentsService } from '../agents/agents.service';
import { PredictionsService } from '../predictions/predictions.service';

@Injectable()
export class RealtimeDataService {
  private readonly logger = new Logger(RealtimeDataService.name);
  private isRunning = false;

  constructor(
    private readonly eventEmitterService: EventEmitterService,
    private readonly liveDataService: LiveDataService,
    private readonly apiFootballService: ApiFootballService,
    private readonly unifiedFootballService: UnifiedFootballService,
    private readonly agentsService: AgentsService,
    private readonly predictionsService: PredictionsService,
  ) {}

  // =============================================================================
  // LIVE MATCH UPDATES - Every 30 seconds
  // =============================================================================

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleLiveMatchUpdates() {
    if (!this.isRunning) return;

    try {
      this.logger.debug('Starting live match updates broadcast');
      
      // Get live matches from API-Football
      const liveMatches = await this.apiFootballService.getLiveMatches();
      
      if (liveMatches.response && liveMatches.response.length > 0) {
        // Broadcast live matches update
        this.eventEmitterService.emitLiveMatchesUpdate(liveMatches.response);
        
        // Process each live match for detailed updates
        for (const match of liveMatches.response) {
          await this.processLiveMatchUpdate(match);
        }
      }
    } catch (error) {
      this.logger.error('Error in live match updates:', error.message);
    }
  }

  private async processLiveMatchUpdate(match: any) {
    try {
      const matchId = match.fixture.id.toString();
      
      // Emit match update
      this.eventEmitterService.emitLiveMatchUpdate(matchId, {
        fixture: match.fixture,
        teams: match.teams,
        goals: match.goals,
        score: match.score,
        events: match.events || [],
      });

      // Emit score update if scores changed
      if (match.goals.home !== undefined && match.goals.away !== undefined) {
        this.eventEmitterService.emitScoreUpdate(
          matchId,
          match.goals.home,
          match.goals.away,
          match.fixture.status.elapsed
        );
      }

      // Process match events
      if (match.events && match.events.length > 0) {
        for (const event of match.events) {
          this.eventEmitterService.emitMatchEvent(matchId, event);
        }
      }
    } catch (error) {
      this.logger.error(`Error processing live match update for ${match.fixture.id}:`, error.message);
    }
  }

  // =============================================================================
  // LEAGUE STANDINGS UPDATES - Every 5 minutes
  // =============================================================================

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleLeagueStandingsUpdates() {
    if (!this.isRunning) return;

    try {
      this.logger.debug('Starting league standings updates broadcast');
      
      // Major leagues to update
      const leagues = [
        { id: 39, name: 'Premier League' },
        { id: 140, name: 'La Liga' },
        { id: 78, name: 'Bundesliga' },
        { id: 135, name: 'Serie A' },
        { id: 61, name: 'Ligue 1' },
        { id: 2, name: 'Champions League' },
      ];

      for (const league of leagues) {
        try {
          const standings = await this.unifiedFootballService.getUnifiedStandings(league.id.toString());
          this.eventEmitterService.emitLeagueStandingsUpdate(league.id.toString(), standings);
        } catch (error) {
          this.logger.error(`Error updating standings for league ${league.id}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('Error in league standings updates:', error.message);
    }
  }

  // =============================================================================
  // PREDICTION UPDATES - Every minute
  // =============================================================================

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePredictionUpdates() {
    if (!this.isRunning) return;

    try {
      this.logger.debug('Starting prediction updates broadcast');
      
      // Get recent predictions that need updates
      const recentPredictions = await this.predictionsService.getRecentPredictions();
      
      for (const prediction of recentPredictions) {
        try {
          // Update prediction confidence based on live data
          const updatedPrediction = await this.updatePredictionConfidence(prediction);
          
          // Emit prediction update to user
          this.eventEmitterService.emitPredictionUpdate(
            prediction.userId,
            updatedPrediction
          );
        } catch (error) {
          this.logger.error(`Error updating prediction ${prediction.id}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('Error in prediction updates:', error.message);
    }
  }

  private async updatePredictionConfidence(prediction: any) {
    try {
      // Get live match data if available
      const match = await this.liveDataService.getLiveMatchData(prediction.matchId);
      
      if (match && match.live_data) {
        // Calculate new confidence based on live match events
        let confidenceChange = 0;
        
        // Adjust confidence based on match progress
        if (match.live_data.status === 'LIVE') {
          confidenceChange += 5; // Slight increase for live matches
        }
        
        // Adjust based on score line
        if (match.live_data.score) {
          const homeScore = match.live_data.score.home || 0;
          const awayScore = match.live_data.score.away || 0;
          
          // Adjust confidence based on how the match is progressing
          if (prediction.predictionType === 'MATCH_RESULT') {
            if (prediction.predictedResult === 'HOME_WIN' && homeScore > awayScore) {
              confidenceChange += 10;
            } else if (prediction.predictedResult === 'AWAY_WIN' && awayScore > homeScore) {
              confidenceChange += 10;
            } else if (prediction.predictedResult === 'DRAW' && homeScore === awayScore) {
              confidenceChange += 10;
            } else {
              confidenceChange -= 5;
            }
          }
        }
        
        // Update prediction confidence
        const newConfidence = Math.max(0, Math.min(100, prediction.confidence + confidenceChange));
        
        return {
          ...prediction,
          confidence: newConfidence,
          lastUpdated: new Date().toISOString(),
        };
      }
      
      return prediction;
    } catch (error) {
      this.logger.error(`Error updating prediction confidence:`, error.message);
      return prediction;
    }
  }

  // =============================================================================
  // AGENT PERFORMANCE MONITORING - Every 5 minutes
  // =============================================================================

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAgentPerformanceUpdates() {
    if (!this.isRunning) return;

    try {
      this.logger.debug('Starting agent performance updates broadcast');
      
      // Get all active agents
      const agents = await this.agentsService.getAllAgents();
      
      for (const agent of agents) {
        try {
          // Get agent performance metrics
          const performance = await this.agentsService.getAgentPerformance(agent.id);
          
          // Emit performance update
          this.eventEmitterService.emitAgentPerformanceUpdate(agent.id, {
            agentId: agent.id,
            agentName: agent.name,
            performance,
            timestamp: new Date().toISOString(),
          });
          
          // Check for agent insights
          const insights = await this.agentsService.getAgentInsights(agent.id);
          if (insights && insights.length > 0) {
            for (const insight of insights) {
              this.eventEmitterService.emitAgentInsight(agent.id, insight);
            }
          }
        } catch (error) {
          this.logger.error(`Error updating agent ${agent.id} performance:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('Error in agent performance updates:', error.message);
    }
  }

  // =============================================================================
  // SERVICE CONTROL METHODS
  // =============================================================================

  start() {
    this.isRunning = true;
    this.logger.log('Real-time data service started');
  }

  stop() {
    this.isRunning = false;
    this.logger.log('Real-time data service stopped');
  }

  isServiceRunning(): boolean {
    return this.isRunning;
  }

  // =============================================================================
  // MANUAL UPDATE METHODS
  // =============================================================================

  async manualLiveMatchUpdate() {
    await this.handleLiveMatchUpdates();
  }

  async manualLeagueStandingsUpdate() {
    await this.handleLeagueStandingsUpdates();
  }

  async manualPredictionUpdate() {
    await this.handlePredictionUpdates();
  }

  async manualAgentPerformanceUpdate() {
    await this.handleAgentPerformanceUpdates();
  }
} 