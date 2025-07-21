import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DataIntegrityReport {
  summary: {
    totalMatches: number;
    matchesWithIssues: number;
    issueTypes: Record<string, number>;
  };
  issues: DataIssue[];
  recommendations: string[];
}

export interface DataIssue {
  type: 'MISSING_ODDS' | 'MISSING_RESULT' | 'INVALID_SCORE' | 'MISSING_TOURNAMENT' | 'DUPLICATE_MATCH' | 'ORPHANED_DATA';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchId?: string;
  description: string;
  affectedFields?: string[];
  suggestedFix?: string;
}

@Injectable()
export class DbDebuggerService {
  private readonly logger = new Logger(DbDebuggerService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Teljes adatbázis integritás ellenőrzés
   */
  async runFullIntegrityCheck(): Promise<DataIntegrityReport> {
    this.logger.log('Adatbázis integritás ellenőrzés indítása...');

    const issues: DataIssue[] = [];
    
    // Különböző ellenőrzések futtatása
    const missingOddsIssues = await this.checkMissingOdds();
    const missingResultsIssues = await this.checkMissingResults();
    const invalidScoreIssues = await this.checkInvalidScores();
    const duplicateMatchIssues = await this.checkDuplicateMatches();
    const orphanedDataIssues = await this.checkOrphanedData();
    const missingTournamentIssues = await this.checkMissingTournaments();

    issues.push(
      ...missingOddsIssues,
      ...missingResultsIssues,
      ...invalidScoreIssues,
      ...duplicateMatchIssues,
      ...orphanedDataIssues,
      ...missingTournamentIssues
    );

    const totalMatches = await this.prisma.match.count();
    const matchesWithIssues = new Set(issues.filter(i => i.matchId).map(i => i.matchId)).size;

    const issueTypes = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recommendations = this.generateRecommendations(issues);

    this.logger.log(`Ellenőrzés befejezve. ${issues.length} probléma találva ${totalMatches} meccsből.`);

    return {
      summary: {
        totalMatches,
        matchesWithIssues,
        issueTypes,
      },
      issues,
      recommendations,
    };
  }

  /**
   * Hiányzó odds ellenőrzése
   */
  private async checkMissingOdds(): Promise<DataIssue[]> {
    const matchesWithoutOdds = await this.prisma.match.findMany({
      where: {
        bettingMarkets: {
          none: {},
        },
      },
      select: {
        id: true,
        date: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        status: true,
      },
    });

    return matchesWithoutOdds.map(match => ({
      type: 'MISSING_ODDS' as const,
      severity: 'HIGH' as const,
      matchId: match.id,
      description: `Hiányzó odds: ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.date.toISOString().split('T')[0]})`,
      affectedFields: ['bettingMarkets'],
      suggestedFix: 'Ellenőrizd a Tippmix PDF feldolgozást vagy a web scraping folyamatot',
    }));
  }

  /**
   * Hiányzó eredmények ellenőrzése
   */
  private async checkMissingResults(): Promise<DataIssue[]> {
    const finishedMatchesWithoutResults = await this.prisma.match.findMany({
      where: {
        status: 'finished',
        result: null,
      },
      select: {
        id: true,
        date: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    return finishedMatchesWithoutResults.map(match => ({
      type: 'MISSING_RESULT' as const,
      severity: 'MEDIUM' as const,
      matchId: match.id,
      description: `Hiányzó eredmény: ${match.homeTeam.name} vs ${match.awayTeam.name} (befejezett meccs)`,
      affectedFields: ['result'],
      suggestedFix: 'Futtasd le a Sofascore vagy Flashscore scraping-et az eredményekért',
    }));
  }

  /**
   * Érvénytelen eredmények ellenőrzése
   */
  private async checkInvalidScores(): Promise<DataIssue[]> {
    const invalidResults = await this.prisma.result.findMany({
      where: {
        OR: [
          { homeScore: { lt: 0 } },
          { awayScore: { lt: 0 } },
          { homeScoreHT: { lt: 0 } },
          { awayScoreHT: { lt: 0 } },
          {
            AND: [
              { homeScoreHT: { not: null } },
              { homeScore: { not: null } },
              { homeScoreHT: { gt: { homeScore: true } } },
            ],
          },
        ],
      },
      include: {
        match: {
          select: {
            id: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
      },
    });

    return invalidResults.map(result => ({
      type: 'INVALID_SCORE' as const,
      severity: 'HIGH' as const,
      matchId: result.match.id,
      description: `Érvénytelen eredmény: ${result.match.homeTeam.name} vs ${result.match.awayTeam.name} (${result.homeScore}-${result.awayScore})`,
      affectedFields: ['homeScore', 'awayScore', 'homeScoreHT', 'awayScoreHT'],
      suggestedFix: 'Ellenőrizd az eredmény feldolgozási logikát',
    }));
  }

  /**
   * Duplikált meccsek ellenőrzése
   */
  private async checkDuplicateMatches(): Promise<DataIssue[]> {
    const duplicates = await this.prisma.$queryRaw<Array<{
      homeTeamId: number;
      awayTeamId: number;
      date: Date;
      count: bigint;
    }>>`
      SELECT "homeTeamId", "awayTeamId", DATE("date") as date, COUNT(*) as count
      FROM "Match"
      GROUP BY "homeTeamId", "awayTeamId", DATE("date")
      HAVING COUNT(*) > 1
    `;

    const issues: DataIssue[] = [];
    
    for (const duplicate of duplicates) {
      const matches = await this.prisma.match.findMany({
        where: {
          homeTeamId: duplicate.homeTeamId,
          awayTeamId: duplicate.awayTeamId,
          date: {
            gte: new Date(duplicate.date.toISOString().split('T')[0]),
            lt: new Date(new Date(duplicate.date).getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      });

      issues.push({
        type: 'DUPLICATE_MATCH' as const,
        severity: 'CRITICAL' as const,
        description: `Duplikált meccs: ${matches[0].homeTeam.name} vs ${matches[0].awayTeam.name} (${Number(duplicate.count)} példány)`,
        suggestedFix: 'Távolítsd el a duplikált bejegyzéseket, tartsd meg a legteljesebbet',
      });
    }

    return issues;
  }

  /**
   * Árva adatok ellenőrzése
   */
  private async checkOrphanedData(): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];

    // Árva eredmények
    const orphanedResults = await this.prisma.result.count({
      where: { match: null },
    });

    if (orphanedResults > 0) {
      issues.push({
        type: 'ORPHANED_DATA' as const,
        severity: 'MEDIUM' as const,
        description: `${orphanedResults} árva eredmény található (meccs nélkül)`,
        suggestedFix: 'Töröld az árva eredményeket vagy kapcsold össze a megfelelő meccsekkel',
      });
    }

    // Árva betting market-ek
    const orphanedMarkets = await this.prisma.bettingMarket.count({
      where: { match: null },
    });

    if (orphanedMarkets > 0) {
      issues.push({
        type: 'ORPHANED_DATA' as const,
        severity: 'MEDIUM' as const,
        description: `${orphanedMarkets} árva betting market található`,
        suggestedFix: 'Töröld az árva betting market-eket',
      });
    }

    return issues;
  }

  /**
   * Hiányzó tournament adatok ellenőrzése
   */
  private async checkMissingTournaments(): Promise<DataIssue[]> {
    const matchesWithoutTournament = await this.prisma.match.findMany({
      where: { tournament: null },
      select: {
        id: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        date: true,
      },
    });

    return matchesWithoutTournament.map(match => ({
      type: 'MISSING_TOURNAMENT' as const,
      severity: 'HIGH' as const,
      matchId: match.id,
      description: `Hiányzó tournament: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
      affectedFields: ['tournamentId'],
      suggestedFix: 'Rendelj hozzá megfelelő tournament-et a meccshez',
    }));
  }

  /**
   * Javaslatok generálása
   */
  private generateRecommendations(issues: DataIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (issueTypes.MISSING_ODDS > 10) {
      recommendations.push('Ellenőrizd a Tippmix PDF feldolgozási folyamatot - sok meccshez hiányoznak az odds-ok');
    }

    if (issueTypes.MISSING_RESULT > 5) {
      recommendations.push('Futtasd le a web scraping-et a hiányzó eredményekért');
    }

    if (issueTypes.DUPLICATE_MATCH > 0) {
      recommendations.push('KRITIKUS: Duplikált meccsek találhatók - azonnali tisztítás szükséges');
    }

    if (issueTypes.INVALID_SCORE > 0) {
      recommendations.push('Ellenőrizd az eredmény feldolgozási logikát - érvénytelen pontszámok');
    }

    if (recommendations.length === 0) {
      recommendations.push('Az adatbázis jó állapotban van! 🎉');
    }

    return recommendations;
  }

  /**
   * Adatbázis statisztikák
   */
  async getDatabaseStats() {
    const [
      totalMatches,
      finishedMatches,
      matchesWithOdds,
      matchesWithResults,
      totalTeams,
      totalTournaments,
      totalPlayers,
    ] = await Promise.all([
      this.prisma.match.count(),
      this.prisma.match.count({ where: { status: 'finished' } }),
      this.prisma.match.count({ where: { bettingMarkets: { some: {} } } }),
      this.prisma.match.count({ where: { result: { isNot: null } } }),
      this.prisma.team.count(),
      this.prisma.tournament.count(),
      this.prisma.player.count(),
    ]);

    return {
      matches: {
        total: totalMatches,
        finished: finishedMatches,
        withOdds: matchesWithOdds,
        withResults: matchesWithResults,
        oddsCompleteness: totalMatches > 0 ? Math.round((matchesWithOdds / totalMatches) * 100) : 0,
        resultCompleteness: finishedMatches > 0 ? Math.round((matchesWithResults / finishedMatches) * 100) : 0,
      },
      entities: {
        teams: totalTeams,
        tournaments: totalTournaments,
        players: totalPlayers,
      },
    };
  }

  /**
   * Adott időszak meccsinek ellenőrzése
   */
  async checkMatchesByDateRange(startDate: Date, endDate: Date): Promise<DataIssue[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        bettingMarkets: true,
        result: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    const issues: DataIssue[] = [];

    for (const match of matches) {
      // Odds ellenőrzés
      if (match.bettingMarkets.length === 0) {
        issues.push({
          type: 'MISSING_ODDS',
          severity: 'HIGH',
          matchId: match.id,
          description: `Hiányzó odds: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
          affectedFields: ['bettingMarkets'],
        });
      }

      // Eredmény ellenőrzés befejezett meccsekhez
      if (match.status === 'finished' && !match.result) {
        issues.push({
          type: 'MISSING_RESULT',
          severity: 'MEDIUM',
          matchId: match.id,
          description: `Hiányzó eredmény: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
          affectedFields: ['result'],
        });
      }
    }

    return issues;
  }
}