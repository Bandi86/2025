import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Great prediction! I agree with your analysis.',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500, { message: 'Comment content cannot exceed 500 characters' })
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    example: 'clx1234567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'Updated comment content',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500, { message: 'Comment content cannot exceed 500 characters' })
  content: string;
}

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  userAvatar?: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty()
  isEdited: boolean;

  @ApiPropertyOptional()
  editedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  isLikedByCurrentUser: boolean;

  @ApiProperty({ type: [CommentResponseDto] })
  replies: CommentResponseDto[];

  @ApiProperty()
  repliesCount: number;
} 