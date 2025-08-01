import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MatchDetailService } from './match-detail.service';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Match Details')
@Controller('api/matches')
export class MatchDetailController {
  constructor(private readonly matchDetailService: MatchDetailService) {}

  @Get(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.MEMBER, Role.ANALYST, Role.ADMIN)
  @ApiOperation({ summary: 'Get detailed match information' })
  @ApiResponse({ status: 200, description: 'Match details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  async getMatchDetail(@Param('id') id: string) {
    return this.matchDetailService.getMatchDetail(id);
  }

  @Get(':id/analytics')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ANALYST, Role.ADMIN)
  @ApiOperation({ summary: 'Get match analytics (Pro feature)' })
  @ApiResponse({ status: 200, description: 'Match analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Pro feature access required' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  async getMatchAnalytics(@Param('id') id: string) {
    return this.matchDetailService.getMatchAnalytics(id);
  }

  @Get(':id/predictions')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.MEMBER, Role.ANALYST, Role.ADMIN)
  @ApiOperation({ summary: 'Get match predictions' })
  @ApiResponse({ status: 200, description: 'Match predictions retrieved successfully' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  async getMatchPredictions(@Param('id') id: string) {
    return this.matchDetailService.getMatchPredictions(id);
  }
} 