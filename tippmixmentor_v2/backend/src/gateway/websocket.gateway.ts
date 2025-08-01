import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { AgentsService } from '../modules/agents/agents.service';
import { AgentEventsService, EventSeverity } from '../modules/agents/agent-events.service';
import { ApiFootballService } from '../modules/football-data/api-football.service';
import { UnifiedFootballService } from '../modules/football-data/unified-football.service';


@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedUsers = new Map<string, Socket>();
  private agentSubscriptions = new Map<string, Set<string>>(); // agentId -> Set of userIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly agentsService: AgentsService,
    private readonly agentEventsService: AgentEventsService,
    private readonly apiFootballService: ApiFootballService,
    private readonly unifiedFootballService: UnifiedFootballService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (token) {
        const decoded = this.jwtService.verify(token.replace('Bearer ', ''));
        const userId = decoded.sub;
        
        this.connectedUsers.set(userId, client);
        client.data.userId = userId;
        
        this.logger.log(`User ${userId} connected`);
        
        // Join user to their personal room
        client.join(`user:${userId}`);
        
        // Send connection confirmation
        client.emit('connected', {
          userId,
          timestamp: new Date().toISOString(),
        });
      } else {
        this.logger.warn('Client connected without authentication');
        client.emit('error', { message: 'Authentication required' });
      }
    } catch (error) {
      this.logger.error('Connection error:', error.message);
      client.emit('error', { message: 'Authentication failed' });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  onModuleInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  // =============================================================================
  // EVENT LISTENERS - Listen to events from EventEmitterService
  // =============================================================================

  @OnEvent('live.match.update')
  handleLiveMatchUpdate(payload: { matchId: string; matchData: any }) {
    this.server.to(`match:${payload.matchId}`).emit('liveMatchUpdate', payload.matchData);
  }

  @OnEvent('live.score.update')
  handleScoreUpdate(payload: { matchId: string; homeScore: number; awayScore: number; minute?: number }) {
    this.server.to(`match:${payload.matchId}`).emit('scoreUpdate', {
      matchId: payload.matchId,
      homeScore: payload.homeScore,
      awayScore: payload.awayScore,
      minute: payload.minute,
    });
  }

  @OnEvent('live.match.event')
  handleMatchEvent(payload: { matchId: string; event: any }) {
    this.server.to(`match:${payload.matchId}`).emit('matchEvent', {
      matchId: payload.matchId,
      event: payload.event,
    });
  }

  @OnEvent('live.matches.update')
  handleLiveMatchesUpdate(payload: { matches: any[] }) {
    this.server.emit('liveMatchesUpdate', payload.matches);
  }

  @OnEvent('league.standings.update')
  handleLeagueStandingsUpdate(payload: { leagueId: string; standings: any }) {
    this.server.to(`league:${payload.leagueId}`).emit('leagueStandingsUpdate', {
      leagueId: payload.leagueId,
      standings: payload.standings,
    });
  }

  @OnEvent('prediction.update')
  handlePredictionUpdate(payload: { userId: string; prediction: any }) {
    this.server.to(`user:${payload.userId}`).emit('predictionUpdate', payload.prediction);
  }

  @OnEvent('agent.event')
  handleAgentEvent(payload: { agentId: string; event: any }) {
    this.server.to(`agent:${payload.agentId}`).emit('agentEvent', {
      agentId: payload.agentId,
      event: payload.event,
    });
  }

  @OnEvent('agent.status.update')
  handleAgentStatusUpdate(payload: { agentId: string; status: any }) {
    this.server.to(`agent:${payload.agentId}`).emit('agentStatusUpdate', {
      agentId: payload.agentId,
      status: payload.status,
    });
  }

  @OnEvent('agent.task.update')
  handleAgentTaskUpdate(payload: { agentId: string; task: any }) {
    this.server.to(`agent:${payload.agentId}`).emit('agentTaskUpdate', {
      agentId: payload.agentId,
      task: payload.task,
    });
  }

  @OnEvent('agent.insight')
  handleAgentInsight(payload: { agentId: string; insight: any }) {
    this.server.to(`agent:${payload.agentId}`).emit('agentInsight', {
      agentId: payload.agentId,
      insight: payload.insight,
    });
  }

  @OnEvent('agent.performance.update')
  handleAgentPerformanceUpdate(payload: { agentId: string; performance: any }) {
    this.server.to(`agent:${payload.agentId}`).emit('agentPerformanceUpdate', {
      agentId: payload.agentId,
      performance: payload.performance,
    });
  }

  @OnEvent('agent.error')
  handleAgentError(payload: { agentId: string; error: any }) {
    this.server.to(`agent:${payload.agentId}`).emit('agentError', {
      agentId: payload.agentId,
      error: payload.error,
    });
  }

  @OnEvent('notification.new')
  handleNotification(payload: { userId: string; notification: any }) {
    this.server.to(`user:${payload.userId}`).emit('notification', payload.notification);
  }

  @OnEvent('user.presence')
  handleUserPresence(payload: { userId: string; isOnline: boolean }) {
    this.server.emit('userPresence', {
      userId: payload.userId,
      isOnline: payload.isOnline,
    });
  }

  @SubscribeMessage('joinMatch')
  handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.join(`match:${matchId}`);
    this.logger.log(`User ${userId} joined match ${matchId}`);
    
    client.emit('joinedMatch', {
      matchId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leaveMatch')
  handleLeaveMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.leave(`match:${matchId}`);
    this.logger.log(`User ${userId} left match ${matchId}`);
    
    client.emit('leftMatch', {
      matchId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('joinLeague')
  handleJoinLeague(
    @ConnectedSocket() client: Socket,
    @MessageBody() leagueId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.join(`league:${leagueId}`);
    this.logger.log(`User ${userId} joined league ${leagueId}`);
    
    client.emit('joinedLeague', {
      leagueId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leaveLeague')
  handleLeaveLeague(
    @ConnectedSocket() client: Socket,
    @MessageBody() leagueId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.leave(`league:${leagueId}`);
    this.logger.log(`User ${userId} left league ${leagueId}`);
    
    client.emit('leftLeague', {
      leagueId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }

  // Server-side methods to emit events
  emitMatchUpdate(matchId: string, data: any) {
    this.server.to(`match:${matchId}`).emit('matchUpdate', {
      matchId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      notification,
      timestamp: new Date().toISOString(),
    });
  }

  emitLeagueUpdate(leagueId: string, data: any) {
    this.server.to(`league:${leagueId}`).emit('leagueUpdate', {
      leagueId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  emitUserPresence(userId: string, isOnline: boolean) {
    this.server.emit('userPresence', {
      userId,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // =============================================================================
  // Agent Event Methods
  // =============================================================================

  @SubscribeMessage('joinAgent')
  handleJoinAgent(
    @ConnectedSocket() client: Socket,
    @MessageBody() agentId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.join(`agent:${agentId}`);
    
    // Track user subscription to agent
    if (!this.agentSubscriptions.has(agentId)) {
      this.agentSubscriptions.set(agentId, new Set());
    }
    this.agentSubscriptions.get(agentId)!.add(userId);

    this.logger.log(`User ${userId} joined agent ${agentId}`);
    
    client.emit('joinedAgent', {
      agentId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leaveAgent')
  handleLeaveAgent(
    @ConnectedSocket() client: Socket,
    @MessageBody() agentId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.leave(`agent:${agentId}`);
    
    // Remove user subscription to agent
    const subscriptions = this.agentSubscriptions.get(agentId);
    if (subscriptions) {
      subscriptions.delete(userId);
      if (subscriptions.size === 0) {
        this.agentSubscriptions.delete(agentId);
      }
    }

    this.logger.log(`User ${userId} left agent ${agentId}`);
    
    client.emit('leftAgent', {
      agentId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('agentCommand')
  async handleAgentCommand(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { agentId: string; command: string; payload?: any },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    try {
      const { agentId, command, payload } = data;
      
      // Log the command event
      await this.agentEventsService.create({
        agentId,
        eventType: 'command_received',
        eventData: { command, payload, userId },
        severity: EventSeverity.INFO,
      });

      // Handle different commands
      switch (command) {
        case 'start':
          await this.agentsService.startAgent(agentId);
          break;
        case 'stop':
          await this.agentsService.stopAgent(agentId);
          break;
        case 'status':
          const status = await this.agentsService.getAgentStatus(agentId);
          client.emit('agentStatus', { agentId, status });
          break;
        case 'health':
          const health = await this.agentsService.getAgentHealth(agentId);
          client.emit('agentHealth', { agentId, health });
          break;
        default:
          client.emit('error', { message: `Unknown command: ${command}` });
          return;
      }

      client.emit('commandExecuted', {
        agentId,
        command,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Agent command error:', error);
      client.emit('error', { message: 'Failed to execute agent command' });
    }
  }

  // =============================================================================
  // Agent Event Broadcasting Methods
  // =============================================================================

  emitAgentEvent(agentId: string, event: any) {
    this.server.to(`agent:${agentId}`).emit('agentEvent', {
      agentId,
      event,
      timestamp: new Date().toISOString(),
    });
  }

  emitAgentStatusUpdate(agentId: string, status: any) {
    this.server.to(`agent:${agentId}`).emit('agentStatusUpdate', {
      agentId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitAgentTaskUpdate(agentId: string, task: any) {
    this.server.to(`agent:${agentId}`).emit('agentTaskUpdate', {
      agentId,
      task,
      timestamp: new Date().toISOString(),
    });
  }

  emitAgentInsight(agentId: string, insight: any) {
    this.server.to(`agent:${agentId}`).emit('agentInsight', {
      agentId,
      insight,
      timestamp: new Date().toISOString(),
    });
  }

  emitAgentPerformanceUpdate(agentId: string, performance: any) {
    this.server.to(`agent:${agentId}`).emit('agentPerformanceUpdate', {
      agentId,
      performance,
      timestamp: new Date().toISOString(),
    });
  }

  emitAgentError(agentId: string, error: any) {
    this.server.to(`agent:${agentId}`).emit('agentError', {
      agentId,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  // =============================================================================
  // REAL-TIME FOOTBALL DATA HANDLERS
  // =============================================================================

  @SubscribeMessage('subscribeToLiveMatches')
  async handleSubscribeToLiveMatches(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.join('live-matches');
    this.logger.log(`User ${userId} subscribed to live matches`);
    
    // Live matches will be sent via events from RealtimeDataService
    client.emit('subscribedToLiveMatches', {
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('unsubscribeFromLiveMatches')
  handleUnsubscribeFromLiveMatches(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.leave('live-matches');
    this.logger.log(`User ${userId} unsubscribed from live matches`);
  }

  @SubscribeMessage('subscribeToLeagueUpdates')
  async handleSubscribeToLeagueUpdates(
    @ConnectedSocket() client: Socket,
    @MessageBody() leagueId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.join(`league:${leagueId}`);
    this.logger.log(`User ${userId} subscribed to league ${leagueId} updates`);
    
          // Send current league data
      try {
        const leagueData = await this.unifiedFootballService.getUnifiedStandings(leagueId);
        client.emit('leagueUpdate', {
          leagueId,
          data: leagueData,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error(`Error fetching league ${leagueId} data:`, error.message);
      }
  }

  @SubscribeMessage('unsubscribeFromLeagueUpdates')
  handleUnsubscribeFromLeagueUpdates(
    @ConnectedSocket() client: Socket,
    @MessageBody() leagueId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.leave(`league:${leagueId}`);
    this.logger.log(`User ${userId} unsubscribed from league ${leagueId} updates`);
  }

  @SubscribeMessage('subscribeToPredictionUpdates')
  handleSubscribeToPredictionUpdates(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.join(`predictions:${userId}`);
    this.logger.log(`User ${userId} subscribed to prediction updates`);
  }

  @SubscribeMessage('unsubscribeFromPredictionUpdates')
  handleUnsubscribeFromPredictionUpdates(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.leave(`predictions:${userId}`);
    this.logger.log(`User ${userId} unsubscribed from prediction updates`);
  }

  // =============================================================================
  // REAL-TIME FOOTBALL DATA EMITTERS
  // =============================================================================

  emitLiveMatchUpdate(matchId: string, matchData: any) {
    this.server.to(`match:${matchId}`).emit('liveMatchUpdate', {
      matchId,
      data: matchData,
      timestamp: new Date().toISOString(),
    });
  }

  emitScoreUpdate(matchId: string, homeScore: number, awayScore: number, minute?: number) {
    this.server.to(`match:${matchId}`).emit('scoreUpdate', {
      matchId,
      homeScore,
      awayScore,
      minute,
      timestamp: new Date().toISOString(),
    });
  }

  emitMatchEvent(matchId: string, event: any) {
    this.server.to(`match:${matchId}`).emit('matchEvent', {
      matchId,
      event,
      timestamp: new Date().toISOString(),
    });
  }

  emitLeagueStandingsUpdate(leagueId: string, standings: any) {
    this.server.to(`league:${leagueId}`).emit('leagueStandingsUpdate', {
      leagueId,
      standings,
      timestamp: new Date().toISOString(),
    });
  }

  emitPredictionUpdate(userId: string, prediction: any) {
    this.server.to(`predictions:${userId}`).emit('predictionUpdate', {
      prediction,
      timestamp: new Date().toISOString(),
    });
  }

  emitLiveMatchesUpdate(matches: any[]) {
    this.server.to('live-matches').emit('liveMatchesUpdate', {
      matches,
      timestamp: new Date().toISOString(),
    });
  }

  // =============================================================================
  // REAL-TIME DATA BROADCASTING METHODS
  // =============================================================================

  // This method is no longer needed as live matches are handled via events
  // async broadcastLiveMatchUpdates() {
  //   // Live matches are now broadcast via events from RealtimeDataService
  // }

  async broadcastLeagueUpdates(leagueId: string) {
    try {
      const standings = await this.unifiedFootballService.getUnifiedStandings(leagueId);
      this.emitLeagueStandingsUpdate(leagueId, standings);
    } catch (error) {
      this.logger.error(`Error broadcasting league ${leagueId} updates:`, error.message);
    }
  }

  // =============================================================================
  // Agent Management Methods
  // =============================================================================

  getAgentSubscribers(agentId: string): string[] {
    const subscriptions = this.agentSubscriptions.get(agentId);
    return subscriptions ? Array.from(subscriptions) : [];
  }

  getAgentSubscriptionsCount(agentId: string): number {
    const subscriptions = this.agentSubscriptions.get(agentId);
    return subscriptions ? subscriptions.size : 0;
  }

  getAllAgentSubscriptions(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [agentId, subscriptions] of this.agentSubscriptions) {
      result[agentId] = Array.from(subscriptions);
    }
    return result;
  }
} 