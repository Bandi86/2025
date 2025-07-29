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

  constructor(private readonly jwtService: JwtService) {}

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
} 