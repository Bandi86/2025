import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ 
    description: 'Notification type',
    enum: ['MATCH_START', 'PREDICTION_RESULT', 'SYSTEM_UPDATE', 'ACHIEVEMENT', 'GENERAL']
  })
  @IsEnum(['MATCH_START', 'PREDICTION_RESULT', 'SYSTEM_UPDATE', 'ACHIEVEMENT', 'GENERAL'])
  type: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Additional notification data', required: false })
  @IsOptional()
  data?: any;
} 