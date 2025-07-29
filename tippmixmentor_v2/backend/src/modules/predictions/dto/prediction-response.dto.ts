import { ApiProperty } from '@nestjs/swagger';

export class PredictionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  matchId: string;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty()
  modelVersion: string;

  @ApiProperty()
  homeWinProb: number;

  @ApiProperty()
  drawProb: number;

  @ApiProperty()
  awayWinProb: number;

  @ApiProperty({ required: false })
  predictedScore?: string;

  @ApiProperty()
  confidence: number;

  @ApiProperty({ required: false })
  features?: any;

  @ApiProperty()
  predictionType: string;

  @ApiProperty({ required: false })
  isCorrect?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  match?: any;

  @ApiProperty({ required: false })
  user?: any;

  @ApiProperty({ required: false })
  insight?: string;

  @ApiProperty({ required: false })
  bettingRecommendations?: any;

  @ApiProperty({ required: false })
  overUnderPrediction?: any;

  @ApiProperty({ required: false })
  bothTeamsScorePrediction?: any;

  @ApiProperty({ required: false })
  fromCache?: boolean;
} 