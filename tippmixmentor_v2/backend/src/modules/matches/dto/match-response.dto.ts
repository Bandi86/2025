import { ApiProperty } from '@nestjs/swagger';

export class MatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  homeTeamId: string;

  @ApiProperty()
  awayTeamId: string;

  @ApiProperty()
  leagueId: string;

  @ApiProperty({ required: false })
  venueId?: string;

  @ApiProperty()
  season: string;

  @ApiProperty()
  matchDate: Date;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  homeScore?: number;

  @ApiProperty({ required: false })
  awayScore?: number;

  @ApiProperty({ required: false })
  homeHalfScore?: number;

  @ApiProperty({ required: false })
  awayHalfScore?: number;

  @ApiProperty({ required: false })
  referee?: string;

  @ApiProperty({ required: false })
  attendance?: number;

  @ApiProperty({ required: false })
  weather?: string;

  @ApiProperty({ required: false })
  temperature?: number;

  @ApiProperty({ required: false })
  humidity?: number;

  @ApiProperty({ required: false })
  windSpeed?: number;

  @ApiProperty()
  isLive: boolean;

  @ApiProperty()
  isFinished: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  homeTeam?: any;

  @ApiProperty({ required: false })
  awayTeam?: any;

  @ApiProperty({ required: false })
  league?: any;

  @ApiProperty({ required: false })
  venue?: any;
} 