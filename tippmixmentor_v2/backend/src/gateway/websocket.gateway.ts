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
import { Logger, OnModuleInit, UseGuards } from '@nestjs/common';
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
  // Fixed: Support multiple sockets per user
  private connectedUsers = new Map<string, Set<Socket>>(); // userId -> Set of Sockets
  private socketToUser = new Map<string, string>(); // socket.id -> userId
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
      // Standardize token retrieval - prefer Authorization header
      let token = client.handshake.headers.authorization;
      if (!token && client.handshake.auth.token) {
        token = client.handshake.auth.token;
      }
      
      if (!token) {
        this.logger.warn('Client connected without authentication token');
        client.emit('error', { 
          code: 'AUTH_REQUIRED',
          message: 'Authentication token required',
          timestamp: new Date().toISOString()
        });
        client.disconnect(true);
        return;
      }

      // Remove Bearer prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      
      try {
        const decoded = this.jwtService.verify(cleanToken);
        const userId = decoded.sub;
        
        if (!userId) {
          throw new Error('Invalid token: missing user ID');
        }

        // Add socket to user's socket set
        if (!this.connectedUsers.has(userId)) {
          this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId)!.add(client);
        
        // Map socket to user
        this.socketToUser.set(client.id, userId);
        
        // Set user data on socket
        client.data.userId = userId;
        
        this.logger.log(`User ${userId} connected (socket: ${client.id})`);
        
        // Join user to their personal room
        client.join(`user:${userId}`);
        
        // Send connection confirmation
        client.emit('connected', {
          userId,
          socketId: client.id,
          timestamp: new Date().toISOString(),
        });
      } catch (jwtError) {
        this.logger.error('JWT verification failed:', jwtError.message);
        client.emit('error', { 
          code: 'AUTH_FAILED',
          message: 'Invalid authentication token',
          timestamp: new Date().toISOString()
        });
        client.disconnect(true);
      }
    } catch (error) {
      this.logger.error('Connection error:', error.message);
      client.emit('error', { 
        code: 'CONNECTION_ERROR',
        message: 'Connection failed',
        timestamp: new Date().toISOString()
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      // Remove socket from user's socket set
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
      
      // Remove socket to user mapping
      this.socketToUser.delete(client.id);
      
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
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

  // =============================================================================
  // MESSAGE HANDLERS - Handle client messages
  // =============================================================================

  @SubscribeMessage('joinMatch')
  handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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

  // =============================================================================
  // SERVER-SIDE EMISSION METHODS
  // =============================================================================

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

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  // Get all sockets for a user
  getUserSockets(userId: string): Socket[] {
    const userSockets = this.connectedUsers.get(userId);
    return userSockets ? Array.from(userSockets) : [];
  }

  // Emit to all sockets of a specific user
  emitToUser(userId: string, event: string, data: any) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.forEach(socket => {
        socket.emit(event, data);
      });
    }
  }

  // =============================================================================
  // AGENT EVENT METHODS
  // =============================================================================

  @SubscribeMessage('joinAgent')
  handleJoinAgent(
    @ConnectedSocket() client: Socket,
    @MessageBody() agentId: string,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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
          client.emit('error', { 
            code: 'UNKNOWN_COMMAND',
            message: `Unknown command: ${command}`,
            timestamp: new Date().toISOString()
          });
          return;
      }

      client.emit('commandExecuted', {
        agentId,
        command,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Agent command error:', error);
      client.emit('error', { 
        code: 'COMMAND_ERROR',
        message: 'Failed to execute agent command',
        timestamp: new Date().toISOString()
      });
    }
  }

  // =============================================================================
  // AGENT EVENT BROADCASTING METHODS
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
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    client.leave(`league:${leagueId}`);
    this.logger.log(`User ${userId} unsubscribed from league ${leagueId} updates`);
  }

  @SubscribeMessage('subscribeToPredictionUpdates')
  handleSubscribeToPredictionUpdates(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    client.join(`predictions:${userId}`);
    this.logger.log(`User ${userId} subscribed to prediction updates`);
  }

  @SubscribeMessage('unsubscribeFromPredictionUpdates')
  handleUnsubscribeFromPredictionUpdates(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { 
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
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

  async broadcastLeagueUpdates(leagueId: string) {
    try {
      const standings = await this.unifiedFootballService.getUnifiedStandings(leagueId);
      this.emitLeagueStandingsUpdate(leagueId, standings);
    } catch (error) {
      this.logger.error(`Error broadcasting league ${leagueId} updates:`, error.message);
    }
  }

  // =============================================================================
  // AGENT MANAGEMENT METHODS
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