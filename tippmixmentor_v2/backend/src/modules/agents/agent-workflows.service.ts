import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { LoggingService } from '../../common/logging/logging.service';
import { MonitoringService } from '../../common/monitoring/monitoring.service';

export enum WorkflowStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface CreateAgentWorkflowDto {
  agentId: string;
  name: string;
  description?: string;
  steps: Record<string, any>;
  isActive?: boolean;
}

export interface AgentWorkflowResponseDto {
  id: string;
  agentId: string;
  name: string;
  description?: string;
  steps: Record<string, any>;
  status: WorkflowStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AgentWorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
    private readonly monitoring: MonitoringService,
  ) {}

  async create(createWorkflowDto: CreateAgentWorkflowDto): Promise<AgentWorkflowResponseDto> {
    try {
      const agent = await this.prisma.agent.findUnique({ where: { id: createWorkflowDto.agentId } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      const workflow = await this.prisma.agentWorkflow.create({
        data: {
          agentId: createWorkflowDto.agentId,
          name: createWorkflowDto.name,
          description: createWorkflowDto.description,
          steps: createWorkflowDto.steps,
          isActive: createWorkflowDto.isActive ?? true,
          status: WorkflowStatus.ACTIVE,
        },
      });

      // this.monitoring.recordMetric('agent_workflow_created', 1, {
      //   agentType: agent.agentType,
      // });

      return this.mapToResponseDto(workflow);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to create agent workflow', error);
      throw new BadRequestException('Failed to create agent workflow');
    }
  }

  async findAll(agentId: string): Promise<AgentWorkflowResponseDto[]> {
    try {
      const workflows = await this.prisma.agentWorkflow.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
      });

      return workflows.map(workflow => this.mapToResponseDto(workflow));
    } catch (error) {
      this.logging.error('Failed to fetch agent workflows', error);
      throw new BadRequestException('Failed to fetch agent workflows');
    }
  }

  async findOne(agentId: string, workflowId: string): Promise<AgentWorkflowResponseDto> {
    try {
      const workflow = await this.prisma.agentWorkflow.findFirst({
        where: { id: workflowId, agentId },
      });

      if (!workflow) {
        throw new NotFoundException('Workflow not found');
      }

      return this.mapToResponseDto(workflow);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to fetch agent workflow', error);
      throw new BadRequestException('Failed to fetch agent workflow');
    }
  }

  async updateStatus(agentId: string, workflowId: string, status: WorkflowStatus): Promise<AgentWorkflowResponseDto> {
    try {
      const workflow = await this.prisma.agentWorkflow.findFirst({
        where: { id: workflowId, agentId },
      });

      if (!workflow) {
        throw new NotFoundException('Workflow not found');
      }

      const updatedWorkflow = await this.prisma.agentWorkflow.update({
        where: { id: workflowId },
        data: { status },
      });

      return this.mapToResponseDto(updatedWorkflow);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to update workflow status', error);
      throw new BadRequestException('Failed to update workflow status');
    }
  }

  async toggleActive(agentId: string, workflowId: string): Promise<AgentWorkflowResponseDto> {
    try {
      const workflow = await this.prisma.agentWorkflow.findFirst({
        where: { id: workflowId, agentId },
      });

      if (!workflow) {
        throw new NotFoundException('Workflow not found');
      }

      const updatedWorkflow = await this.prisma.agentWorkflow.update({
        where: { id: workflowId },
        data: { isActive: !workflow.isActive },
      });

      return this.mapToResponseDto(updatedWorkflow);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to toggle workflow active status', error);
      throw new BadRequestException('Failed to toggle workflow active status');
    }
  }

  private mapToResponseDto(workflow: any): AgentWorkflowResponseDto {
    return {
      id: workflow.id,
      agentId: workflow.agentId,
      name: workflow.name,
      description: workflow.description,
      steps: workflow.steps,
      status: workflow.status,
      isActive: workflow.isActive,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }
} 