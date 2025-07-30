import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from './create-post.dto';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  isVerified: boolean;
}

export class CommentSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  userAvatar?: string;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  isLikedByCurrentUser: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  repliesCount: number;
}

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: PostType })
  type: PostType;

  @ApiPropertyOptional()
  matchId?: string;

  @ApiPropertyOptional()
  predictionId?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  isEdited: boolean;

  @ApiPropertyOptional()
  editedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  user: UserSummaryDto;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  commentsCount: number;

  @ApiProperty()
  isLikedByCurrentUser: boolean;

  @ApiProperty({ type: [String] })
  hashtags: string[];

  @ApiPropertyOptional()
  match?: {
    id: string;
    homeTeam: { name: string; logo?: string };
    awayTeam: { name: string; logo?: string };
    matchDate: Date;
    status: string;
  };

  @ApiPropertyOptional()
  prediction?: {
    id: string;
    predictedScore?: string;
    confidence: number;
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
  };
}

export class PostFeedResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  posts: PostResponseDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  hasMore: boolean;

  @ApiProperty()
  nextCursor?: string;
} 