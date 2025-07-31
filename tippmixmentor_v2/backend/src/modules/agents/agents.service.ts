import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { LoggingService } from '../../common/logging/logging.service';
import { MonitoringService } from '../../common/monitoring/monitoring.service';
import { CreateAgentDto, AgentType } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentResponseDto, AgentStatus } from './dto/agent-response.dto';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class AgentsService {
  private readonly agentOsUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logging: LoggingService,
    private readonly monitoring: MonitoringService,
    private readonly configService: ConfigService,
  ) {
    this.agentOsUrl = this.configService.get('AGENT_OS_URL', 'http://localhost:8000');
  }

  async create(createAgentDto: CreateAgentDto): Promise<AgentResponseDto> {
    try {
      this.logging.log('Creating new agent', 'AGENTS', { agentType: createAgentDto.agentType });

      // Create agent in database
      const agent = await this.prisma.agent.create({
        data: {
          name: createAgentDto.name,
          agentType: createAgentDto.agentType,
          config: createAgentDto.config || {},
          metadata: createAgentDto.metadata || {},
          version: createAgentDto.version || '1.0.0',
          isActive: createAgentDto.isActive ?? true,
          status: AgentStatus.INACTIVE,
        },
      });

      // Create agent in Agent OS
      await this.createAgentInOs(agent.id, createAgentDto);

      // Create performance record
      await this.prisma.agentPerformance.create({
        data: {
          agentId: agent.id,
        },
      });

      // this.monitoring.recordMetric('agent_created', 1, { type: createAgentDto.agentType });

      return this.mapToResponseDto(agent);
    } catch (error) {
      this.logging.error('Failed to create agent', error);
      throw new BadRequestException('Failed to create agent');
    }
  }

  async findAll(): Promise<AgentResponseDto[]> {
    try {
      const agents = await this.prisma.agent.findMany({
        include: {
          performance: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return agents.map(agent => this.mapToResponseDto(agent));
    } catch (error) {
      this.logging.error('Failed to fetch agents', error);
      throw new BadRequestException('Failed to fetch agents');
    }
  }

  async findOne(id: string): Promise<AgentResponseDto> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id },
        include: {
          performance: true,
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          events: {
            orderBy: { timestamp: 'desc' },
            take: 10,
          },
        },
      });

      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      return this.mapToResponseDto(agent);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to fetch agent', error);
      throw new BadRequestException('Failed to fetch agent');
    }
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentResponseDto> {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      const updatedAgent = await this.prisma.agent.update({
        where: { id },
        data: updateAgentDto,
      });

      // Update agent in Agent OS if configuration changed
      if (updateAgentDto.config) {
        await this.updateAgentInOs(id, updateAgentDto);
      }

      this.logging.log('Agent updated', 'AGENTS', { agentId: id });
      return this.mapToResponseDto(updatedAgent);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to update agent', error);
      throw new BadRequestException('Failed to update agent');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      // Stop agent in Agent OS
      await this.stopAgentInOs(id);

      // Delete agent from database (cascade will handle related records)
      await this.prisma.agent.delete({ where: { id } });

      this.logging.log('Agent deleted', 'AGENTS', { agentId: id });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to delete agent', error);
      throw new BadRequestException('Failed to delete agent');
    }
  }

  async startAgent(id: string): Promise<AgentResponseDto> {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      // Start agent in Agent OS
      await this.startAgentInOs(id);

      // Update status in database
      const updatedAgent = await this.prisma.agent.update({
        where: { id },
        data: { status: AgentStatus.ACTIVE },
      });

      this.logging.log('Agent started', 'AGENTS', { agentId: id });
      return this.mapToResponseDto(updatedAgent);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to start agent', error);
      throw new BadRequestException('Failed to start agent');
    }
  }

  async stopAgent(id: string): Promise<AgentResponseDto> {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      // Stop agent in Agent OS
      await this.stopAgentInOs(id);

      // Update status in database
      const updatedAgent = await this.prisma.agent.update({
        where: { id },
        data: { status: AgentStatus.INACTIVE },
      });

      this.logging.log('Agent stopped', 'AGENTS', { agentId: id });
      return this.mapToResponseDto(updatedAgent);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to stop agent', error);
      throw new BadRequestException('Failed to stop agent');
    }
  }

  async getAgentStatus(id: string): Promise<any> {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      // Get status from Agent OS
      const response = await axios.get(`${this.agentOsUrl}/agents/${id}/status`);
      return response.data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to get agent status', error);
      throw new BadRequestException('Failed to get agent status');
    }
  }

  async getAgentHealth(id: string): Promise<any> {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      // Get health from Agent OS
      const response = await axios.get(`${this.agentOsUrl}/agents/${id}/health`);
      return response.data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to get agent health', error);
      throw new BadRequestException('Failed to get agent health');
    }
  }

  async updateHeartbeat(id: string): Promise<void> {
    try {
      await this.prisma.agent.update({
        where: { id },
        data: { lastHeartbeat: new Date() },
      });
    } catch (error) {
      this.logging.error('Failed to update agent heartbeat', error);
    }
  }

  private async createAgentInOs(agentId: string, createAgentDto: CreateAgentDto): Promise<void> {
    try {
      const response: AxiosResponse = await axios.post(`${this.agentOsUrl}/agents/`, {
        name: createAgentDto.name,
        agent_type: createAgentDto.agentType.toLowerCase(),
        config: createAgentDto.config || {},
      });

      // Store the Agent OS agent ID in Redis for mapping
      await this.redis.set(`agent:${agentId}:os_id`, response.data.agent_id);
    } catch (error) {
      this.logging.error('Failed to create agent in Agent OS', error);
      throw new BadRequestException('Failed to create agent in Agent OS');
    }
  }

  private async updateAgentInOs(agentId: string, updateAgentDto: UpdateAgentDto): Promise<void> {
    try {
      const osAgentId = await this.redis.get(`agent:${agentId}:os_id`);
      if (!osAgentId) {
        throw new BadRequestException('Agent OS ID not found');
      }

      await axios.put(`${this.agentOsUrl}/agents/${osAgentId}`, {
        config: updateAgentDto.config,
      });
    } catch (error) {
      this.logging.error('Failed to update agent in Agent OS', error);
      throw new BadRequestException('Failed to update agent in Agent OS');
    }
  }

  private async startAgentInOs(agentId: string): Promise<void> {
    try {
      const osAgentId = await this.redis.get(`agent:${agentId}:os_id`);
      if (!osAgentId) {
        throw new BadRequestException('Agent OS ID not found');
      }

      await axios.post(`${this.agentOsUrl}/agents/${osAgentId}/start`);
    } catch (error) {
      this.logging.error('Failed to start agent in Agent OS', error);
      throw new BadRequestException('Failed to start agent in Agent OS');
    }
  }

  private async stopAgentInOs(agentId: string): Promise<void> {
    try {
      const osAgentId = await this.redis.get(`agent:${agentId}:os_id`);
      if (!osAgentId) {
        throw new BadRequestException('Agent OS ID not found');
      }

      await axios.post(`${this.agentOsUrl}/agents/${osAgentId}/stop`);
    } catch (error) {
      this.logging.error('Failed to stop agent in Agent OS', error);
      throw new BadRequestException('Failed to stop agent in Agent OS');
    }
  }

  private mapToResponseDto(agent: any): AgentResponseDto {
    return {
      id: agent.id,
      name: agent.name,
      agentType: agent.agentType,
      status: agent.status,
      config: agent.config,
      metadata: agent.metadata,
      version: agent.version,
      isActive: agent.isActive,
      lastHeartbeat: agent.lastHeartbeat,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
} 