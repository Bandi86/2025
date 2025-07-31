import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { LoggingService } from '../../common/logging/logging.service';

import { CreateAgentTaskDto, TaskStatus, TaskPriority } from './dto/agent-task.dto';
import { AgentTaskResponseDto } from './dto/agent-task.dto';
import axios from 'axios';

@Injectable()
export class AgentTasksService {
  private readonly agentOsUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logging: LoggingService,
    private readonly configService: ConfigService,
  ) {
    this.agentOsUrl = this.configService.get('AGENT_OS_URL', 'http://localhost:8000');
  }

  async create(agentId: string, createTaskDto: CreateAgentTaskDto): Promise<AgentTaskResponseDto> {
    try {
      // Verify agent exists
      const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      // Create task in database
      const task = await this.prisma.agentTask.create({
        data: {
          agentId,
          taskType: createTaskDto.taskType,
          priority: createTaskDto.priority,
          inputData: createTaskDto.inputData || {},
          status: TaskStatus.PENDING,
        },
      });

      // Create task in Agent OS
      await this.createTaskInOs(agentId, task.id, createTaskDto);

      // this.monitoring.recordMetric('agent_task_created', 1, { 
      //   agentType: agent.agentType,
      //   taskType: createTaskDto.taskType,
      //   priority: createTaskDto.priority,
      // });

      return this.mapToResponseDto(task);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to create agent task', error);
      throw new BadRequestException('Failed to create agent task');
    }
  }

  async findAll(agentId: string, limit = 50, offset = 0): Promise<AgentTaskResponseDto[]> {
    try {
      const tasks = await this.prisma.agentTask.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return tasks.map(task => this.mapToResponseDto(task));
    } catch (error) {
      this.logging.error('Failed to fetch agent tasks', error);
      throw new BadRequestException('Failed to fetch agent tasks');
    }
  }

  async findOne(agentId: string, taskId: string): Promise<AgentTaskResponseDto> {
    try {
      const task = await this.prisma.agentTask.findFirst({
        where: { id: taskId, agentId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      return this.mapToResponseDto(task);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to fetch agent task', error);
      throw new BadRequestException('Failed to fetch agent task');
    }
  }

  async updateStatus(agentId: string, taskId: string, status: TaskStatus, outputData?: any, error?: string): Promise<AgentTaskResponseDto> {
    try {
      const task = await this.prisma.agentTask.findFirst({
        where: { id: taskId, agentId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const updateData: any = { status };
      
      if (status === TaskStatus.RUNNING && !task.startedAt) {
        updateData.startedAt = new Date();
      } else if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
        updateData.completedAt = new Date();
        if (outputData) {
          updateData.outputData = outputData;
        }
        if (error) {
          updateData.error = error;
        }
      }

      const updatedTask = await this.prisma.agentTask.update({
        where: { id: taskId },
        data: updateData,
      });

      // Update performance metrics
      await this.updatePerformanceMetrics(agentId, status);

      return this.mapToResponseDto(updatedTask);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logging.error('Failed to update task status', error);
      throw new BadRequestException('Failed to update task status');
    }
  }

  async cancelTask(agentId: string, taskId: string): Promise<AgentTaskResponseDto> {
    try {
      const task = await this.prisma.agentTask.findFirst({
        where: { id: taskId, agentId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.RUNNING) {
        throw new BadRequestException('Task cannot be cancelled');
      }

      // Cancel task in Agent OS
      await this.cancelTaskInOs(agentId, taskId);

      const updatedTask = await this.prisma.agentTask.update({
        where: { id: taskId },
        data: { 
          status: TaskStatus.CANCELLED,
          completedAt: new Date(),
        },
      });

      return this.mapToResponseDto(updatedTask);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logging.error('Failed to cancel task', error);
      throw new BadRequestException('Failed to cancel task');
    }
  }

  async getTaskResult(agentId: string, taskId: string): Promise<any> {
    try {
      const task = await this.prisma.agentTask.findFirst({
        where: { id: taskId, agentId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      if (task.status !== TaskStatus.COMPLETED) {
        throw new BadRequestException('Task is not completed');
      }

      return {
        taskId: task.id,
        status: task.status,
        outputData: task.outputData,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logging.error('Failed to get task result', error);
      throw new BadRequestException('Failed to get task result');
    }
  }

  async getTasksByStatus(agentId: string, status: TaskStatus): Promise<AgentTaskResponseDto[]> {
    try {
      const tasks = await this.prisma.agentTask.findMany({
        where: { agentId, status },
        orderBy: { createdAt: 'desc' },
      });

      return tasks.map(task => this.mapToResponseDto(task));
    } catch (error) {
      this.logging.error('Failed to fetch tasks by status', error);
      throw new BadRequestException('Failed to fetch tasks by status');
    }
  }

  async getTasksByPriority(agentId: string, priority: TaskPriority): Promise<AgentTaskResponseDto[]> {
    try {
      const tasks = await this.prisma.agentTask.findMany({
        where: { agentId, priority },
        orderBy: { createdAt: 'desc' },
      });

      return tasks.map(task => this.mapToResponseDto(task));
    } catch (error) {
      this.logging.error('Failed to fetch tasks by priority', error);
      throw new BadRequestException('Failed to fetch tasks by priority');
    }
  }

  private async createTaskInOs(agentId: string, taskId: string, createTaskDto: CreateAgentTaskDto): Promise<void> {
    try {
      const osAgentId = await this.redis.get(`agent:${agentId}:os_id`);
      if (!osAgentId) {
        throw new BadRequestException('Agent OS ID not found');
      }

      await axios.post(`${this.agentOsUrl}/agents/${osAgentId}/tasks`, {
        task_type: createTaskDto.taskType,
        input_data: createTaskDto.inputData || {},
      });

      // Store task mapping
      await this.redis.set(`task:${taskId}:os_id`, `${osAgentId}:${taskId}`);
    } catch (error) {
      this.logging.error('Failed to create task in Agent OS', error);
      throw new BadRequestException('Failed to create task in Agent OS');
    }
  }

  private async cancelTaskInOs(agentId: string, taskId: string): Promise<void> {
    try {
      const osTaskId = await this.redis.get(`task:${taskId}:os_id`);
      if (osTaskId) {
        const [osAgentId] = osTaskId.split(':');
        await axios.delete(`${this.agentOsUrl}/agents/${osAgentId}/tasks/${taskId}`);
      }
    } catch (error) {
      this.logging.error('Failed to cancel task in Agent OS', error);
      // Don't throw error as the task is already cancelled in database
    }
  }

  private async updatePerformanceMetrics(agentId: string, status: TaskStatus): Promise<void> {
    try {
      const performance = await this.prisma.agentPerformance.findUnique({
        where: { agentId },
      });

      if (performance) {
        const updateData: any = {
          totalTasks: { increment: 1 },
          lastActivity: new Date(),
        };

        if (status === TaskStatus.COMPLETED) {
          updateData.completedTasks = { increment: 1 };
        } else if (status === TaskStatus.FAILED) {
          updateData.failedTasks = { increment: 1 };
        }

        await this.prisma.agentPerformance.update({
          where: { agentId },
          data: updateData,
        });
      }
    } catch (error) {
      this.logging.error('Failed to update performance metrics', error);
    }
  }

  private mapToResponseDto(task: any): AgentTaskResponseDto {
    return {
      id: task.id,
      agentId: task.agentId,
      taskType: task.taskType,
      status: task.status,
      priority: task.priority,
      inputData: task.inputData,
      outputData: task.outputData,
      error: task.error,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
} 