import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { LoggingService } from '../../common/logging/logging.service';
import { MonitoringService } from '../../common/monitoring/monitoring.service';

export enum EventSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface CreateAgentEventDto {
  agentId: string;
  eventType: string;
  eventData?: Record<string, any>;
  severity?: EventSeverity;
}

export interface AgentEventResponseDto {
  id: string;
  agentId: string;
  eventType: string;
  eventData?: Record<string, any>;
  severity: EventSeverity;
  timestamp: Date;
}

@Injectable()
export class AgentEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
    private readonly monitoring: MonitoringService,
  ) {}

  async create(createEventDto: CreateAgentEventDto): Promise<AgentEventResponseDto> {
    try {
      // Verify agent exists
      const agent = await this.prisma.agent.findUnique({ where: { id: createEventDto.agentId } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      const event = await this.prisma.agentEvent.create({
        data: {
          agentId: createEventDto.agentId,
          eventType: createEventDto.eventType,
          eventData: createEventDto.eventData || {},
          severity: createEventDto.severity || EventSeverity.INFO,
        },
      });

      // this.monitoring.recordMetric('agent_event_created', 1, {
      //   agentType: agent.agentType,
      //   eventType: createEventDto.eventType,
      //   severity: createEventDto.severity || EventSeverity.INFO,
      // });

      // Log critical and error events
      if (event.severity === EventSeverity.CRITICAL || event.severity === EventSeverity.ERROR) {
        this.logging.error(`Agent event: ${event.eventType}`, 'AGENT_EVENTS');
      }

      return this.mapToResponseDto(event);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to create agent event', error);
      throw new BadRequestException('Failed to create agent event');
    }
  }

  async findAll(agentId: string, limit = 100, offset = 0): Promise<AgentEventResponseDto[]> {
    try {
      const events = await this.prisma.agentEvent.findMany({
        where: { agentId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return events.map(event => this.mapToResponseDto(event));
    } catch (error) {
      this.logging.error('Failed to fetch agent events', error);
      throw new BadRequestException('Failed to fetch agent events');
    }
  }

  async findOne(agentId: string, eventId: string): Promise<AgentEventResponseDto> {
    try {
      const event = await this.prisma.agentEvent.findFirst({
        where: { id: eventId, agentId },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      return this.mapToResponseDto(event);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to fetch agent event', error);
      throw new BadRequestException('Failed to fetch agent event');
    }
  }

  async getEventsByType(agentId: string, eventType: string, limit = 50): Promise<AgentEventResponseDto[]> {
    try {
      const events = await this.prisma.agentEvent.findMany({
        where: { agentId, eventType },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return events.map(event => this.mapToResponseDto(event));
    } catch (error) {
      this.logging.error('Failed to fetch events by type', error);
      throw new BadRequestException('Failed to fetch events by type');
    }
  }

  async getEventsBySeverity(agentId: string, severity: EventSeverity, limit = 50): Promise<AgentEventResponseDto[]> {
    try {
      const events = await this.prisma.agentEvent.findMany({
        where: { agentId, severity },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return events.map(event => this.mapToResponseDto(event));
    } catch (error) {
      this.logging.error('Failed to fetch events by severity', error);
      throw new BadRequestException('Failed to fetch events by severity');
    }
  }

  async getRecentEvents(agentId: string, hours = 24): Promise<AgentEventResponseDto[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const events = await this.prisma.agentEvent.findMany({
        where: {
          agentId,
          timestamp: {
            gte: cutoffTime,
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      return events.map(event => this.mapToResponseDto(event));
    } catch (error) {
      this.logging.error('Failed to fetch recent events', error);
      throw new BadRequestException('Failed to fetch recent events');
    }
  }

  async getEventStats(agentId: string, hours = 24): Promise<any> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const stats = await this.prisma.agentEvent.groupBy({
        by: ['severity', 'eventType'],
        where: {
          agentId,
          timestamp: {
            gte: cutoffTime,
          },
        },
        _count: {
          id: true,
        },
      });

      return {
        totalEvents: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        bySeverity: stats.reduce((acc, stat) => {
          acc[stat.severity] = (acc[stat.severity] || 0) + stat._count.id;
          return acc;
        }, {}),
        byType: stats.reduce((acc, stat) => {
          acc[stat.eventType] = (acc[stat.eventType] || 0) + stat._count.id;
          return acc;
        }, {}),
      };
    } catch (error) {
      this.logging.error('Failed to get event stats', error);
      throw new BadRequestException('Failed to get event stats');
    }
  }

  async clearOldEvents(agentId: string, days = 30): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      await this.prisma.agentEvent.deleteMany({
        where: {
          agentId,
          timestamp: {
            lt: cutoffTime,
          },
        },
      });

      this.logging.log('Cleared old agent events', 'AGENT_EVENTS', { agentId, days });
    } catch (error) {
      this.logging.error('Failed to clear old events', error);
      throw new BadRequestException('Failed to clear old events');
    }
  }

  private mapToResponseDto(event: any): AgentEventResponseDto {
    return {
      id: event.id,
      agentId: event.agentId,
      eventType: event.eventType,
      eventData: event.eventData,
      severity: event.severity,
      timestamp: event.timestamp,
    };
  }
} 