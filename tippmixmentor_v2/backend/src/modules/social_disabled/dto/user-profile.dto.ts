import { IsString, IsOptional, IsUrl, IsBoolean, IsNumber, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'User bio',
    example: 'Football enthusiast and prediction expert. Love analyzing matches and sharing insights!',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'User location',
    example: 'London, UK',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  location?: string;

  @ApiPropertyOptional({
    description: 'Personal website URL',
    example: 'https://myfootballblog.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Social media links',
    example: {
      twitter: 'https://twitter.com/username',
      instagram: 'https://instagram.com/username',
      linkedin: 'https://linkedin.com/in/username',
    },
  })
  @IsOptional()
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };

  @ApiPropertyOptional({
    description: 'Favorite team',
    example: 'Manchester United',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Favorite team cannot exceed 100 characters' })
  favoriteTeam?: string;

  @ApiPropertyOptional({
    description: 'Favorite player',
    example: 'Cristiano Ronaldo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Favorite player cannot exceed 100 characters' })
  favoritePlayer?: string;
}

export class UserProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };

  @ApiPropertyOptional()
  favoriteTeam?: string;

  @ApiPropertyOptional()
  favoritePlayer?: string;

  @ApiProperty()
  predictionAccuracy: number;

  @ApiProperty()
  totalPredictions: number;

  @ApiProperty()
  followersCount: number;

  @ApiProperty()
  followingCount: number;

  @ApiProperty()
  postsCount: number;

  @ApiProperty({ type: [String] })
  achievements: string[];

  @ApiProperty({ type: [String] })
  badges: string[];

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  isFollowedByCurrentUser: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserFollowResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  followerId: string;

  @ApiProperty()
  followingId: string;

  @ApiProperty()
  follower: {
    id: string;
    username: string;
    avatar?: string;
  };

  @ApiProperty()
  following: {
    id: string;
    username: string;
    avatar?: string;
  };

  @ApiProperty()
  createdAt: Date;
}

export class UserSearchResponseDto {
  @ApiProperty({ type: [UserProfileResponseDto] })
  users: UserProfileResponseDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  hasMore: boolean;
} 