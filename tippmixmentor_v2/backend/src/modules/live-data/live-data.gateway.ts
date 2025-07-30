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
import { LiveDataService } from './live-data.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveDataGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveDataGateway.name);
  private readonly activeStreams = new Map<string, NodeJS.Timeout>();

  constructor(private readonly liveDataService: LiveDataService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up any active streams for this client
    this.activeStreams.forEach((interval, key) => {
      if (key.includes(client.id)) {
        clearInterval(interval);
        this.activeStreams.delete(key);
      }
    });
  }

  @SubscribeMessage('subscribeToMatch')
  async handleSubscribeToMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId } = data;
    this.logger.log(`Client ${client.id} subscribing to match ${matchId}`);

    try {
      // Get initial data
      const initialData = await this.liveDataService.getLiveMatchData(matchId);
      client.emit('matchData', initialData);

      // Set up real-time updates
      const streamKey = `${matchId}-${client.id}`;
      if (this.activeStreams.has(streamKey)) {
        clearInterval(this.activeStreams.get(streamKey));
      }

      const interval = setInterval(async () => {
        try {
          const liveData = await this.liveDataService.getLiveMatchData(matchId);
          client.emit('matchData', liveData);
        } catch (error) {
          this.logger.error(`Error streaming data for match ${matchId}:`, error.message);
          client.emit('matchData', {
            match_id: matchId,
            error: 'Failed to fetch live data',
            timestamp: new Date().toISOString(),
          });
        }
      }, 30000); // Update every 30 seconds

      this.activeStreams.set(streamKey, interval);

      // Send confirmation
      client.emit('subscriptionConfirmed', {
        matchId,
        message: 'Successfully subscribed to live match updates',
        updateInterval: 30000,
      });
    } catch (error) {
      this.logger.error(`Failed to subscribe to match ${matchId}:`, error.message);
      client.emit('subscriptionError', {
        matchId,
        error: 'Failed to subscribe to match updates',
      });
    }
  }

  @SubscribeMessage('unsubscribeFromMatch')
  handleUnsubscribeFromMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { matchId } = data;
    this.logger.log(`Client ${client.id} unsubscribing from match ${matchId}`);

    const streamKey = `${matchId}-${client.id}`;
    if (this.activeStreams.has(streamKey)) {
      clearInterval(this.activeStreams.get(streamKey));
      this.activeStreams.delete(streamKey);
    }

    client.emit('unsubscriptionConfirmed', {
      matchId,
      message: 'Successfully unsubscribed from match updates',
    });
  }

  @SubscribeMessage('getLiveMatches')
  async handleGetLiveMatches(@ConnectedSocket() client: Socket) {
    try {
      const liveMatches = await this.liveDataService.getLiveMatches();
      client.emit('liveMatches', liveMatches);
    } catch (error) {
      this.logger.error('Failed to get live matches:', error.message);
      client.emit('liveMatches', {
        error: 'Failed to fetch live matches',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('getUpcomingMatches')
  async handleGetUpcomingMatches(
    @MessageBody() data: { limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { limit = 10 } = data;
      const upcomingMatches = await this.liveDataService.getUpcomingMatches(limit);
      client.emit('upcomingMatches', upcomingMatches);
    } catch (error) {
      this.logger.error('Failed to get upcoming matches:', error.message);
      client.emit('upcomingMatches', {
        error: 'Failed to fetch upcoming matches',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Broadcast live updates to all connected clients
  async broadcastMatchUpdate(matchId: string, data: any) {
    this.server.emit('matchUpdate', {
      matchId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast live match start
  async broadcastMatchStart(matchId: string, matchData: any) {
    this.server.emit('matchStart', {
      matchId,
      matchData,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast match end
  async broadcastMatchEnd(matchId: string, finalScore: any) {
    this.server.emit('matchEnd', {
      matchId,
      finalScore,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast goal scored
  async broadcastGoal(matchId: string, goalData: any) {
    this.server.emit('goalScored', {
      matchId,
      goalData,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast card given
  async broadcastCard(matchId: string, cardData: any) {
    this.server.emit('cardGiven', {
      matchId,
      cardData,
      timestamp: new Date().toISOString(),
    });
  }
} 