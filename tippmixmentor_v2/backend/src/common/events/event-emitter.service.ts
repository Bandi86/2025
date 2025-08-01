import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventEmitterService {
  private readonly logger = new Logger(EventEmitterService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  // Live Match Events
  emitLiveMatchUpdate(matchId: string, matchData: any) {
    this.eventEmitter.emit('live.match.update', { matchId, matchData });
  }

  emitScoreUpdate(matchId: string, homeScore: number, awayScore: number, minute?: number) {
    this.eventEmitter.emit('live.score.update', { matchId, homeScore, awayScore, minute });
  }

  emitMatchEvent(matchId: string, event: any) {
    this.eventEmitter.emit('live.match.event', { matchId, event });
  }

  emitLiveMatchesUpdate(matches: any[]) {
    this.eventEmitter.emit('live.matches.update', { matches });
  }

  // League Events
  emitLeagueStandingsUpdate(leagueId: string, standings: any) {
    this.eventEmitter.emit('league.standings.update', { leagueId, standings });
  }

  // Prediction Events
  emitPredictionUpdate(userId: string, prediction: any) {
    this.eventEmitter.emit('prediction.update', { userId, prediction });
  }

  // Agent Events
  emitAgentEvent(agentId: string, event: any) {
    this.eventEmitter.emit('agent.event', { agentId, event });
  }

  emitAgentStatusUpdate(agentId: string, status: any) {
    this.eventEmitter.emit('agent.status.update', { agentId, status });
  }

  emitAgentTaskUpdate(agentId: string, task: any) {
    this.eventEmitter.emit('agent.task.update', { agentId, task });
  }

  emitAgentInsight(agentId: string, insight: any) {
    this.eventEmitter.emit('agent.insight', { agentId, insight });
  }

  emitAgentPerformanceUpdate(agentId: string, performance: any) {
    this.eventEmitter.emit('agent.performance.update', { agentId, performance });
  }

  emitAgentError(agentId: string, error: any) {
    this.eventEmitter.emit('agent.error', { agentId, error });
  }

  // Notification Events
  emitNotification(userId: string, notification: any) {
    this.eventEmitter.emit('notification.new', { userId, notification });
  }

  // User Events
  emitUserPresence(userId: string, isOnline: boolean) {
    this.eventEmitter.emit('user.presence', { userId, isOnline });
  }
} 