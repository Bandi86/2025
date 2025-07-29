import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreatePredictionDto {
  @ApiProperty({ description: 'Match ID' })
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @ApiProperty({ description: 'User ID', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Model version used for prediction' })
  @IsString()
  @IsNotEmpty()
  modelVersion: string;

  @ApiProperty({ description: 'Home team win probability', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  homeWinProb: number;

  @ApiProperty({ description: 'Draw probability', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  drawProb: number;

  @ApiProperty({ description: 'Away team win probability', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  awayWinProb: number;

  @ApiProperty({ description: 'Predicted score (e.g., "2-1")', required: false })
  @IsString()
  @IsOptional()
  predictedScore?: string;

  @ApiProperty({ description: 'Prediction confidence', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ description: 'Model features used for prediction' })
  @IsOptional()
  features?: any;

  @ApiProperty({ 
    description: 'Prediction type', 
    enum: ['MATCH_RESULT', 'OVER_UNDER', 'BOTH_TEAMS_SCORE', 'EXACT_SCORE', 'FIRST_GOAL_SCORER'] 
  })
  @IsEnum(['MATCH_RESULT', 'OVER_UNDER', 'BOTH_TEAMS_SCORE', 'EXACT_SCORE', 'FIRST_GOAL_SCORER'])
  @IsOptional()
  predictionType?: string;
} 