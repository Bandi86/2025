import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateMatchDto {
  @ApiProperty({ description: 'Home team ID' })
  @IsString()
  @IsNotEmpty()
  homeTeamId: string;

  @ApiProperty({ description: 'Away team ID' })
  @IsString()
  @IsNotEmpty()
  awayTeamId: string;

  @ApiProperty({ description: 'League ID' })
  @IsString()
  @IsNotEmpty()
  leagueId: string;

  @ApiProperty({ description: 'Venue ID', required: false })
  @IsString()
  @IsOptional()
  venueId?: string;

  @ApiProperty({ description: 'Season' })
  @IsString()
  @IsNotEmpty()
  season: string;

  @ApiProperty({ description: 'Match date and time' })
  @IsDateString()
  matchDate: string;

  @ApiProperty({ description: 'Match status', enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED'] })
  @IsEnum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED'])
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Home team score', required: false })
  @IsNumber()
  @IsOptional()
  homeScore?: number;

  @ApiProperty({ description: 'Away team score', required: false })
  @IsNumber()
  @IsOptional()
  awayScore?: number;

  @ApiProperty({ description: 'Home team half-time score', required: false })
  @IsNumber()
  @IsOptional()
  homeHalfScore?: number;

  @ApiProperty({ description: 'Away team half-time score', required: false })
  @IsNumber()
  @IsOptional()
  awayHalfScore?: number;

  @ApiProperty({ description: 'Referee name', required: false })
  @IsString()
  @IsOptional()
  referee?: string;

  @ApiProperty({ description: 'Attendance count', required: false })
  @IsNumber()
  @IsOptional()
  attendance?: number;

  @ApiProperty({ description: 'Weather conditions', required: false })
  @IsString()
  @IsOptional()
  weather?: string;

  @ApiProperty({ description: 'Temperature', required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ description: 'Humidity percentage', required: false })
  @IsNumber()
  @IsOptional()
  humidity?: number;

  @ApiProperty({ description: 'Wind speed', required: false })
  @IsNumber()
  @IsOptional()
  windSpeed?: number;

  @ApiProperty({ description: 'Is match live', required: false })
  @IsBoolean()
  @IsOptional()
  isLive?: boolean;

  @ApiProperty({ description: 'Is match finished', required: false })
  @IsBoolean()
  @IsOptional()
  isFinished?: boolean;
} 