import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DbDebuggerService, DataIntegrityReport } from './db-debugger.service';

@ApiTags('Database Debugger')
@Controller('db-debugger')
export class DbDebuggerController {
  constructor(private readonly dbDebuggerService: DbDebuggerService) {}

  @Get('integrity-check')
  @ApiOperation({ 
    summary: 'Teljes adatbázis integritás ellenőrzés',
    description: 'Átfogó ellenőrzés az adatbázis állapotáról, hiányzó adatokról és hibákról'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Integritás jelentés sikeresen generálva',
    type: Object
  })
  async runIntegrityCheck(): Promise<DataIntegrityReport> {
    return this.dbDebuggerService.runFullIntegrityCheck();
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Adatbázis statisztikák',
    description: 'Általános statisztikák az adatbázis tartalmáról'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statisztikák sikeresen lekérve'
  })
  async getDatabaseStats() {
    return this.dbDebuggerService.getDatabaseStats();
  }

  @Post('check-date-range')
  @ApiOperation({ 
    summary: 'Adott időszak meccsinek ellenőrzése',
    description: 'Ellenőrzi egy megadott időszak meccseit hiányzó adatokért'
  })
  @ApiQuery({ name: 'startDate', description: 'Kezdő dátum (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', description: 'Befejező dátum (YYYY-MM-DD)', example: '2025-01-31' })
  @ApiResponse({ 
    status: 200, 
    description: 'Időszak ellenőrzés befejezve'
  })
  async checkDateRange(
    @Body() body: { startDate: string; endDate: string }
  ) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    
    const issues = await this.dbDebuggerService.checkMatchesByDateRange(startDate, endDate);
    
    return {
      period: {
        startDate: body.startDate,
        endDate: body.endDate,
      },
      issuesFound: issues.length,
      issues,
    };
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Adatbázis egészség gyors ellenőrzés',
    description: 'Gyors áttekintés az adatbázis állapotáról'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Egészség ellenőrzés befejezve'
  })
  async getHealthCheck() {
    const stats = await this.dbDebuggerService.getDatabaseStats();
    
    const healthScore = Math.round(
      (stats.matches.oddsCompleteness + stats.matches.resultCompleteness) / 2
    );

    let status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
    
    if (healthScore >= 90) status = 'EXCELLENT';
    else if (healthScore >= 75) status = 'GOOD';
    else if (healthScore >= 50) status = 'WARNING';
    else status = 'CRITICAL';

    return {
      status,
      healthScore,
      summary: {
        totalMatches: stats.matches.total,
        dataCompleteness: {
          odds: `${stats.matches.oddsCompleteness}%`,
          results: `${stats.matches.resultCompleteness}%`,
        },
      },
      recommendation: this.getHealthRecommendation(status, stats),
    };
  }

  private getHealthRecommendation(
    status: string, 
    stats: any
  ): string {
    switch (status) {
      case 'EXCELLENT':
        return 'Az adatbázis kiváló állapotban van! 🎉';
      case 'GOOD':
        return 'Az adatbázis jó állapotban van, kisebb hiányosságok lehetnek.';
      case 'WARNING':
        return 'Figyelem: Jelentős adathiányok vannak. Futtasd le a data ingestion folyamatokat.';
      case 'CRITICAL':
        return 'KRITIKUS: Súlyos adathiányok! Azonnali beavatkozás szükséges.';
      default:
        return 'Ismeretlen állapot.';
    }
  }
}