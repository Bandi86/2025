import { IsString, IsOptional, IsEnum, IsBoolean, IsUUID, MaxLength, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PostType {
  GENERAL = 'GENERAL',
  PREDICTION = 'PREDICTION',
  MATCH_COMMENTARY = 'MATCH_COMMENTARY',
  ANALYSIS = 'ANALYSIS',
  NEWS = 'NEWS',
  QUESTION = 'QUESTION',
  POLL = 'POLL',
}

export class CreatePostDto {
  @ApiProperty({
    description: 'Post content',
    example: 'What do you think about tonight\'s match? I predict a 2-1 win for the home team!',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000, { message: 'Post content cannot exceed 1000 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'Type of post',
    enum: PostType,
    default: PostType.GENERAL,
  })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType = PostType.GENERAL;

  @ApiPropertyOptional({
    description: 'Related match ID',
    example: 'clx1234567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  matchId?: string;

  @ApiPropertyOptional({
    description: 'Related prediction ID',
    example: 'clx1234567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  predictionId?: string;

  @ApiPropertyOptional({
    description: 'Optional image URL',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the post is public',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @ApiPropertyOptional({
    description: 'Array of hashtags',
    example: ['#football', '#prediction', '#matchday'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  hashtags?: string[];
} 