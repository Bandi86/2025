import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentType } from './create-agent.dto';

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  STARTING = 'STARTING',
  STOPPING = 'STOPPING',
}

export class AgentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the agent',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the agent',
    example: 'Match Prediction Agent v2.1',
  })
  name: string;

  @ApiProperty({
    description: 'Type of the agent',
    enum: AgentType,
    example: AgentType.PREDICTION,
  })
  agentType: AgentType;

  @ApiProperty({
    description: 'Current status of the agent',
    enum: AgentStatus,
    example: AgentStatus.ACTIVE,
  })
  status: AgentStatus;

  @ApiPropertyOptional({
    description: 'Agent configuration object',
  })
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata for the agent',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Agent version',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: 'Whether the agent is active',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Last heartbeat timestamp',
    example: '2024-01-15T12:00:00Z',
  })
  lastHeartbeat?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T12:00:00Z',
  })
  updatedAt: Date;
} 