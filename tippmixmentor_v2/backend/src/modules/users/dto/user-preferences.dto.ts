import { IsString, IsArray, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStrategyDto {
  @ApiProperty({ description: 'Strategy name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Filter type for the strategy' })
  @IsString()
  filterType: string;

  @ApiProperty({ description: 'Whether the strategy is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({ description: 'Selected league IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  leagues: string[];

  @ApiProperty({ description: 'Selected market IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  markets: string[];

  @ApiProperty({ description: 'Default quick filter', required: false })
  @IsOptional()
  @IsString()
  defaultFilter?: string;

  @ApiProperty({ description: 'Notification preferences', required: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ description: 'Push notification preferences', required: false })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;
}

export class StrategyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  filterType: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  hitRate: number;

  @ApiProperty()
  roi: number;

  @ApiProperty()
  totalPredictions: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserPreferencesResponseDto {
  @ApiProperty({ type: [String] })
  leagues: string[];

  @ApiProperty({ type: [String] })
  markets: string[];

  @ApiProperty({ required: false })
  defaultFilter?: string;

  @ApiProperty()
  emailNotifications: boolean;

  @ApiProperty()
  pushNotifications: boolean;

  @ApiProperty()
  onboardingCompleted: boolean;
} 