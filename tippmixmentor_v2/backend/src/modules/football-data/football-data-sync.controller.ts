import { Controller, Get, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FootballDataSyncService } from './football-data-sync.service';

@ApiTags('Football Data Synchronization')
@Controller('football-data-sync')
export class FootballDataSyncController {
  constructor(private readonly footballDataSyncService: FootballDataSyncService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get synchronization status for all APIs' })
  @ApiResponse({ status: 200, description: 'Sync status information' })
  async getSyncStatus() {
    try {
      const status = await this.footballDataSyncService.getSyncStatus();
      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get sync status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('quality-report')
  @ApiOperation({ summary: 'Get data quality report for all APIs' })
  @ApiResponse({ status: 200, description: 'Data quality report' })
  async getDataQualityReport() {
    try {
      const report = await this.footballDataSyncService.getDataQualityReport();
      return {
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get data quality report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/:leagueCode')
  @ApiOperation({ summary: 'Manually sync data for a specific league' })
  @ApiParam({ name: 'leagueCode', description: 'League code (e.g., PL, PD, SA)' })
  @ApiResponse({ status: 200, description: 'Sync operation result' })
  async manualSyncLeague(@Param('leagueCode') leagueCode: string) {
    try {
      const result = await this.footballDataSyncService.manualSyncLeague(leagueCode);
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to sync league data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync-all')
  @ApiOperation({ summary: 'Manually sync data for all supported leagues' })
  @ApiResponse({ status: 200, description: 'Sync operation result for all leagues' })
  async syncAllLeagues() {
    try {
      const supportedLeagues = ['PL', 'PD', 'SA', 'BL1', 'FL1', 'CL', 'EL'];
      const results = [];

      for (const leagueCode of supportedLeagues) {
        try {
          const result = await this.footballDataSyncService.manualSyncLeague(leagueCode);
          results.push({ leagueCode, ...result });
        } catch (error) {
          results.push({ 
            leagueCode, 
            success: false, 
            error: error.message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      return {
        success: true,
        data: {
          results,
          summary: {
            total: totalCount,
            successful: successCount,
            failed: totalCount - successCount,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to sync all leagues: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 