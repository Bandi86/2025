import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { LoggingService } from '../../common/logging/logging.service';


export interface CreateAgentInsightDto {
  agentId: string;
  insightType: string;
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface AgentInsightResponseDto {
  id: string;
  agentId: string;
  insightType: string;
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

@Injectable()
export class AgentInsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
  ) {}

  async create(createInsightDto: CreateAgentInsightDto): Promise<AgentInsightResponseDto> {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id: createInsightDto.agentId } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      const insight = await this.prisma.agentInsight.create({
        data: {
          agentId: createInsightDto.agentId,
          insightType: createInsightDto.insightType,
          content: createInsightDto.content,
          confidence: createInsightDto.confidence,
          metadata: createInsightDto.metadata || {},
        },
      });

      // this.monitoring.recordMetric('agent_insight_created', 1, {
      //   agentType: agent.agentType,
      //   insightType: createInsightDto.insightType,
      // });

      return this.mapToResponseDto(insight);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to create agent insight', error);
      throw new BadRequestException('Failed to create agent insight');
    }
  }

  async findAll(agentId: string, limit = 50, offset = 0): Promise<AgentInsightResponseDto[]> {
    try {
      const insights = await this.prisma.agentInsight.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return insights.map(insight => this.mapToResponseDto(insight));
    } catch (error) {
      this.logging.error('Failed to fetch agent insights', error);
      throw new BadRequestException('Failed to fetch agent insights');
    }
  }

  async findByType(agentId: string, insightType: string, limit = 20): Promise<AgentInsightResponseDto[]> {
    try {
      const insights = await this.prisma.agentInsight.findMany({
        where: { agentId, insightType },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return insights.map(insight => this.mapToResponseDto(insight));
    } catch (error) {
      this.logging.error('Failed to fetch insights by type', error);
      throw new BadRequestException('Failed to fetch insights by type');
    }
  }

  async getRecentInsights(agentId: string, hours = 24): Promise<AgentInsightResponseDto[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const insights = await this.prisma.agentInsight.findMany({
        where: {
          agentId,
          createdAt: {
            gte: cutoffTime,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return insights.map(insight => this.mapToResponseDto(insight));
    } catch (error) {
      this.logging.error('Failed to fetch recent insights', error);
      throw new BadRequestException('Failed to fetch recent insights');
    }
  }

  private mapToResponseDto(insight: any): AgentInsightResponseDto {
    return {
      id: insight.id,
      agentId: insight.agentId,
      insightType: insight.insightType,
      content: insight.content,
      confidence: insight.confidence,
      metadata: insight.metadata,
      createdAt: insight.createdAt,
    };
  }
} 