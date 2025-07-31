import { IsString, IsEnum, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AgentType {
  PREDICTION = 'PREDICTION',
  ANALYTICS = 'ANALYTICS',
  MONITORING = 'MONITORING',
  INSIGHT = 'INSIGHT',
  WORKFLOW = 'WORKFLOW',
  CUSTOM = 'CUSTOM',
}

export class CreateAgentDto {
  @ApiProperty({
    description: 'Name of the agent',
    example: 'Match Prediction Agent v2.1',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of the agent',
    enum: AgentType,
    example: AgentType.PREDICTION,
  })
  @IsEnum(AgentType)
  agentType: AgentType;

  @ApiPropertyOptional({
    description: 'Agent configuration object',
    example: {
      modelVersion: '2.1.0',
      confidenceThreshold: 0.8,
      updateInterval: 300,
    },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata for the agent',
    example: {
      description: 'Advanced prediction agent with ML capabilities',
      tags: ['ml', 'prediction', 'football'],
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Agent version',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({
    description: 'Whether the agent should be active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 