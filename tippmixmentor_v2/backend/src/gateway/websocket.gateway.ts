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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AgentsService } from '../modules/agents/agents.service';
import { AgentEventsService, EventSeverity } from '../modules/agents/agent-events.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedUsers = new Map<string, Socket>();
  private agentSubscriptions = new Map<string, Set<string>>(); // agentId -> Set of userIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly agentsService: AgentsService,
    private readonly agentEventsService: AgentEventsService,
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

  emitScoreUpdate(matchId: string, homeScore: number, awayScore: number) {
    this.server.to(`match:${matchId}`).emit('scoreUpdate', {
      matchId,
      homeScore,
      awayScore,
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

  emitPredictionUpdate(userId: string, prediction: any) {
    this.server.to(`user:${userId}`).emit('predictionUpdate', {
      prediction,
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