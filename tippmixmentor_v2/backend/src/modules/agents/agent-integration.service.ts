import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { LoggingService } from '../../common/logging/logging.service';

export interface CreateAgentIntegrationDto {
  name: string;
  type: string;
  config: Record<string, any>;
  isActive?: boolean;
}

export interface AgentIntegrationResponseDto {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AgentIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
  ) {}

  async create(createIntegrationDto: CreateAgentIntegrationDto): Promise<AgentIntegrationResponseDto> {
    try {
      const integration = await this.prisma.agentIntegration.create({
        data: {
          name: createIntegrationDto.name,
          type: createIntegrationDto.type,
          config: createIntegrationDto.config,
          isActive: createIntegrationDto.isActive ?? true,
        },
      });

      return this.mapToResponseDto(integration);
    } catch (error) {
      this.logging.error('Failed to create agent integration', error);
      throw new BadRequestException('Failed to create agent integration');
    }
  }

  async findAll(): Promise<AgentIntegrationResponseDto[]> {
    try {
      const integrations = await this.prisma.agentIntegration.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return integrations.map(integration => this.mapToResponseDto(integration));
    } catch (error) {
      this.logging.error('Failed to fetch agent integrations', error);
      throw new BadRequestException('Failed to fetch agent integrations');
    }
  }

  async findOne(id: string): Promise<AgentIntegrationResponseDto> {
    try {
      const integration = await this.prisma.agentIntegration.findUnique({
        where: { id },
      });

      if (!integration) {
        throw new NotFoundException('Integration not found');
      }

      return this.mapToResponseDto(integration);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to fetch agent integration', error);
      throw new BadRequestException('Failed to fetch agent integration');
    }
  }

  async findByType(type: string): Promise<AgentIntegrationResponseDto[]> {
    try {
      const integrations = await this.prisma.agentIntegration.findMany({
        where: { type, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return integrations.map(integration => this.mapToResponseDto(integration));
    } catch (error) {
      this.logging.error('Failed to fetch integrations by type', error);
      throw new BadRequestException('Failed to fetch integrations by type');
    }
  }

  async toggleActive(id: string): Promise<AgentIntegrationResponseDto> {
    try {
      const integration = await this.prisma.agentIntegration.findUnique({
        where: { id },
      });

      if (!integration) {
        throw new NotFoundException('Integration not found');
      }

      const updatedIntegration = await this.prisma.agentIntegration.update({
        where: { id },
        data: { isActive: !integration.isActive },
      });

      return this.mapToResponseDto(updatedIntegration);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to toggle integration active status', error);
      throw new BadRequestException('Failed to toggle integration active status');
    }
  }

  private mapToResponseDto(integration: any): AgentIntegrationResponseDto {
    return {
      id: integration.id,
      name: integration.name,
      type: integration.type,
      config: integration.config,
      isActive: integration.isActive,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }
} 