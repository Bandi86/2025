import { IsString, IsEnum, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateAgentTaskDto {
  @ApiProperty({
    description: 'Type of task to execute',
    example: 'predict_match',
  })
  @IsString()
  taskType: string;

  @ApiProperty({
    description: 'Priority level of the task',
    enum: TaskPriority,
    example: TaskPriority.NORMAL,
  })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiPropertyOptional({
    description: 'Input data for the task',
    example: { matchId: 'clx1234567890abcdef' },
  })
  @IsOptional()
  @IsObject()
  inputData?: Record<string, any>;
}

export class AgentTaskResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the task',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the agent that owns this task',
    example: 'clx1234567890abcdef',
  })
  agentId: string;

  @ApiProperty({
    description: 'Type of task',
    example: 'predict_match',
  })
  taskType: string;

  @ApiProperty({
    description: 'Current status of the task',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Priority level of the task',
    enum: TaskPriority,
    example: TaskPriority.NORMAL,
  })
  priority: TaskPriority;

  @ApiPropertyOptional({
    description: 'Input data for the task',
  })
  inputData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Output data from the task',
  })
  outputData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Error message if task failed',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'When the task started',
  })
  startedAt?: Date;

  @ApiPropertyOptional({
    description: 'When the task completed',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'When the task was created',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the task was last updated',
  })
  updatedAt: Date;
} 