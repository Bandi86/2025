import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { LoggingService } from '../../common/logging/logging.service';

@Injectable()
export class AgentPerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
  ) {}

  async getPerformance(agentId: string) {
    try {
      const performance = await this.prisma.agentPerformance.findUnique({
        where: { agentId },
      });

      if (!performance) {
        throw new NotFoundException('Performance data not found');
      }

      return {
        totalTasks: performance.totalTasks,
        completedTasks: performance.completedTasks,
        failedTasks: performance.failedTasks,
        averageResponseTime: performance.averageResponseTime,
        successRate: performance.successRate,
        uptime: performance.uptime,
        lastActivity: performance.lastActivity,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to get agent performance', error);
      throw new Error('Failed to get agent performance');
    }
  }

  async updatePerformance(agentId: string, data: any) {
    try {
      await this.prisma.agentPerformance.update({
        where: { agentId },
        data: {
          ...data,
          lastActivity: new Date(),
        },
      });
    } catch (error) {
      this.logging.error('Failed to update agent performance', error);
    }
  }
} 