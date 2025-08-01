import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);
  private readonly store: RateLimitStore = {};
  private readonly limit: number;
  private readonly ttl: number;

  constructor(private readonly configService: ConfigService) {
    this.limit = this.configService.get('RATE_LIMIT_LIMIT', 100);
    this.ttl = this.configService.get('RATE_LIMIT_TTL', 60) * 1000; // Convert to milliseconds
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request);

    const now = Date.now();
    const record = this.store[key];

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.store[key] = {
        count: 1,
        resetTime: now + this.ttl,
      };
    } else if (record.count >= this.limit) {
      // Rate limit exceeded
      this.logger.warn(`Rate limit exceeded for ${key}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    } else {
      // Increment counter
      record.count++;
    }

    return next.handle();
  }

  private generateKey(request: Request): string {
    // Use IP address as the primary key
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    
    // Optionally include user ID if authenticated
    const userId = (request as any).user?.id;
    
    // Include the endpoint path to have different limits per endpoint
    const path = request.route?.path || request.path;
    
    return userId ? `${ip}:${userId}:${path}` : `${ip}:${path}`;
  }

  // Clean up expired records periodically
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }

  // Get current rate limit status for a key
  getRateLimitStatus(key: string): { count: number; limit: number; resetTime: number } | null {
    const record = this.store[key];
    if (!record) return null;

    return {
      count: record.count,
      limit: this.limit,
      resetTime: record.resetTime,
    };
  }
} 