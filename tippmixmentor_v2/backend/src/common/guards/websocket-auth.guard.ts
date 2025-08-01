import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WebSocketAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    
    try {
      // Check if user is already authenticated
      if (!client.data.userId) {
        throw new WsException({
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        });
      }

      return true;
    } catch (error) {
      this.logger.error('WebSocket authentication failed:', error.message);
      throw new WsException({
        code: 'AUTH_FAILED',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

@Injectable()
export class WebSocketOptionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketOptionalAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    
    // Allow access even if not authenticated (for public events)
    // The handler can check client.data.userId if needed
    return true;
  }
} 