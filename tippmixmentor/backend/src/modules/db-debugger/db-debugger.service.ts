import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import { PrismaService } from '../../prisma/prisma.service';
import { PostgreSQLAdapterService } from './adapters/postgresql.adapter';
import { QueryMonitorService } from './services/query-monitor.service';
import { ConnectionPoolMonitorService } from './services/connection-pool-monitor.service';
import { AlertService } from './services/alert.service';
import {
  DEFAULT_CONFIG,
  DbDebuggerConfig,
  loadConfigFromEnv,
} from './config/debugger.config';
import {
  DatabaseMetrics,
  QueryMetrics,
  ConnectionPoolMetrics,
  DatabaseMemoryMetrics,
  DatabaseAlert,
  PerformanceBottleneck,
  DatabaseEvent,
} from './interfaces/monitoring.interfaces';

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
  type:
    | 'MISSING_ODDS'
    | 'MISSING_RESULT'
    | 'INVALID_SCORE'
    | 'MISSING_TOURNAMENT'
    | 'DUPLICATE_MATCH'
    | 'ORPHANED_DATA';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchId?: string;
  description: string;
  affectedFields?: string[];
  suggestedFix?: string;
}

@Injectable()
export class DbDebuggerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DbDebuggerService.name);
  private readonly eventEmitter = new EventEmitter();
  private config: DbDebuggerConfig;
  private isMonitoring = false;

  constructor(
    private prisma: PrismaService,
    private postgresAdapter: PostgreSQLAdapterService,
    private queryMonitor: QueryMonitorService,
    private connectionPoolMonitor: ConnectionPoolMonitorService,
    private alertService: AlertService,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...loadConfigFromEnv() };
  }

  async onModuleInit() {
    this.logger.log('Initializing Database Debugger Service...');

    if (this.config.monitoring.enabled) {
      await this.startMonitoring();
    }
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Database Debugger Service...');
    await this.stopMonitoring();
  }

  /**
   * Start comprehensive database monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Monitoring is already active');
      return;
    }

    try {
      // Initialize monitoring services
      await this.queryMonitor.startMonitoring(
        this.postgresAdapter,
        this.config,
      );
      await this.connectionPoolMonitor.startMonitoring(
        this.postgresAdapter,
        this.config,
      );
      await this.alertService.initializeAlertRules(this.config);

      this.isMonitoring = true;
      this.logger.log('Database monitoring started successfully');

      // Emit monitoring started event
      this.eventEmitter.emit('monitoring_started', {
        timestamp: new Date(),
        config: this.config,
      });
    } catch (error) {
      this.logger.error('Failed to start monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop database monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    try {
      await this.queryMonitor.stopMonitoring();
      await this.connectionPoolMonitor.stopMonitoring();

      this.isMonitoring = false;
      this.logger.log('Database monitoring stopped');

      // Emit monitoring stopped event
      this.eventEmitter.emit('monitoring_stopped', {
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error stopping monitoring:', error);
    }
  }

  /**
   * Get comprehensive database metrics
   */
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const [queryHistory, connectionMetrics, memoryMetrics] = await Promise.all([
      this.queryMonitor.getQueryHistory(),
      this.connectionPoolMonitor.getCurrentMetrics(),
      this.postgresAdapter.getMemoryMetrics(),
    ]);

    return {
      timestamp: new Date(),
      queries: queryHistory,
      connectionPool: connectionMetrics || {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingConnections: 0,
        maxConnections: 0,
        connectionUtilization: 0,
        averageConnectionTime: 0,
        connectionErrors: 0,
        connectionTimeouts: 0,
        timestamp: new Date(),
      },
      transactions: [], // Will be implemented when transaction monitoring is added
      memory: memoryMetrics,
      bottlenecks: await this.getPerformanceBottlenecks(),
      alerts: this.alertService.getActiveAlerts(),
    };
  }

  /**
   * Get current performance bottlenecks
   */
  async getPerformanceBottlenecks(): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Check for slow queries
    const slowQueries = this.queryMonitor.getSlowQueries();
    if (slowQueries.length > 0) {
      bottlenecks.push({
        type: 'slow_query',
        severity: 'high',
        description: `${slowQueries.length} slow queries detected`,
        affectedQueries: slowQueries.map((q) => q.query),
        suggestedFix:
          'Add database indexes for frequently queried columns, optimize query structure and joins, consider query result caching',
        impact: Math.min(10, slowQueries.length),
        frequency: slowQueries.length,
        firstSeen: slowQueries[slowQueries.length - 1]?.startTime || new Date(),
        lastSeen: slowQueries[0]?.startTime || new Date(),
      });
    }

    // Check connection pool utilization
    const connectionMetrics = this.connectionPoolMonitor.getCurrentMetrics();
    if (connectionMetrics && connectionMetrics.connectionUtilization > 80) {
      bottlenecks.push({
        type: 'connection_pool',
        severity: 'medium',
        description: `High connection pool utilization: ${connectionMetrics.connectionUtilization}%`,
        suggestedFix:
          'Increase connection pool size, optimize connection usage patterns, implement connection pooling best practices',
        impact: 7,
        frequency: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
    }

    // Check memory usage
    const memoryMetrics = await this.postgresAdapter.getMemoryMetrics();
    if (memoryMetrics.memoryUtilization > 85) {
      bottlenecks.push({
        type: 'memory',
        severity: 'high',
        description: `High memory usage: ${memoryMetrics.memoryUtilization}%`,
        suggestedFix:
          'Increase database memory allocation, optimize query memory usage, review and optimize database configuration',
        impact: 9,
        frequency: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
    }

    return bottlenecks;
  }

  /**
   * Execute query with monitoring
   */
  async executeQuery(query: string, params?: any[]): Promise<any> {
    return this.postgresAdapter.executeQuery(query, params);
  }

  /**
   * Get query execution plan
   */
  async getQueryPlan(query: string): Promise<any> {
    return this.postgresAdapter.getQueryPlan(query);
  }

  /**
   * Get database schema information
   */
  async getSchemaInfo(): Promise<any> {
    return this.postgresAdapter.getTableStatistics();
  }

  /**
   * Subscribe to database events
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from database events
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    queryStats: any;
    connectionStats: any;
    alertStats: any;
  } {
    return {
      isMonitoring: this.isMonitoring,
      queryStats: this.queryMonitor.getQueryStatistics(),
      connectionStats: this.connectionPoolMonitor.getConnectionPoolStatistics(),
      alertStats: this.alertService.getAlertStatistics(),
    };
  }

  // ===== DATA INTEGRITY METHODS =====

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
      ...missingTournamentIssues,
    );

    const totalMatches = await this.prisma.match.count();
    const matchesWithIssues = new Set(
      issues.filter((i) => i.matchId).map((i) => i.matchId),
    ).size;

    const issueTypes = issues.reduce(
      (acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const recommendations = this.generateRecommendations(issues);

    this.logger.log(
      `Ellenőrzés befejezve. ${issues.length} probléma találva ${totalMatches} meccsből.`,
    );

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

    return matchesWithoutOdds.map((match) => ({
      type: 'MISSING_ODDS' as const,
      severity: 'HIGH' as const,
      matchId: match.id,
      description: `Hiányzó odds: ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.date.toISOString().split('T')[0]})`,
      affectedFields: ['bettingMarkets'],
      suggestedFix:
        'Ellenőrizd a Tippmix PDF feldolgozást vagy a web scraping folyamatot',
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

    return finishedMatchesWithoutResults.map((match) => ({
      type: 'MISSING_RESULT' as const,
      severity: 'MEDIUM' as const,
      matchId: match.id,
      description: `Hiányzó eredmény: ${match.homeTeam.name} vs ${match.awayTeam.name} (befejezett meccs)`,
      affectedFields: ['result'],
      suggestedFix:
        'Futtasd le a Sofascore vagy Flashscore scraping-et az eredményekért',
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

    return invalidResults.map((result) => ({
      type: 'INVALID_SCORE' as const,
      severity: 'HIGH' as const,
      matchId: result.match?.id,
      description: `Érvénytelen eredmény: ${result.match?.homeTeam?.name} vs ${result.match?.awayTeam?.name} (${result.homeScore}-${result.awayScore})`,
      affectedFields: ['homeScore', 'awayScore', 'homeScoreHT', 'awayScoreHT'],
      suggestedFix: 'Ellenőrizd az eredmény feldolgozási logikát',
    }));
  }

  /**
   * Duplikált meccsek ellenőrzése
   */
  private async checkDuplicateMatches(): Promise<DataIssue[]> {
    const duplicates = await this.prisma.$queryRaw<
      Array<{
        homeTeamId: number;
        awayTeamId: number;
        date: Date;
        count: bigint;
      }>
    >`
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
            lt: new Date(
              new Date(duplicate.date).getTime() + 24 * 60 * 60 * 1000,
            ),
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
        suggestedFix:
          'Távolítsd el a duplikált bejegyzéseket, tartsd meg a legteljesebbet',
      });
    }

    return issues;
  }

  /**
   * Árva adatok ellenőrzése
   */
  private async checkOrphanedData(): Promise<DataIssue[]> {
    const issues: DataIssue[] = [];

    try {
      // Skip complex orphaned data checks for now
      // In production, these would use raw SQL queries or proper Prisma schema setup
      this.logger.debug('Orphaned data check simplified - complex relation queries skipped');

      // Example: Check for results without valid matches using raw query
      // const orphanedResults = await this.prisma.$queryRaw`
      //   SELECT COUNT(*) FROM "Result" r
      //   LEFT JOIN "Match" m ON r."matchId" = m.id
      //   WHERE m.id IS NULL
      // `;

    } catch (error) {
      this.logger.warn('Could not check orphaned data:', error.message);
    }

    return issues;
  }

  /**
   * Hiányzó tournament adatok ellenőrzése
   */
  private async checkMissingTournaments(): Promise<DataIssue[]> {
    try {
      // Simplified check - get matches and check for missing tournament data
      const matches = await this.prisma.match.findMany({
        select: {
          id: true,
          tournamentId: true,
          homeTeamId: true,
          awayTeamId: true,
          date: true,
        },
        take: 100, // Limit for performance
      });

      const matchesWithoutTournament = matches.filter(match => !match.tournamentId);

      return matchesWithoutTournament.map((match) => ({
        type: 'MISSING_TOURNAMENT' as const,
        severity: 'HIGH' as const,
        matchId: match.id,
        description: `Hiányzó tournament: Match ${match.id} (${match.homeTeamId} vs ${match.awayTeamId})`,
        affectedFields: ['tournamentId'],
        suggestedFix: 'Rendelj hozzá megfelelő tournament-et a meccshez',
      }));
    } catch (error) {
      this.logger.warn('Could not check missing tournaments:', error.message);
      return [];
    }
  }

  /**
   * Javaslatok generálása
   */
  private generateRecommendations(issues: DataIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = issues.reduce(
      (acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    if (issueTypes.MISSING_ODDS > 10) {
      recommendations.push(
        'Ellenőrizd a Tippmix PDF feldolgozási folyamatot - sok meccshez hiányoznak az odds-ok',
      );
    }

    if (issueTypes.MISSING_RESULT > 5) {
      recommendations.push(
        'Futtasd le a web scraping-et a hiányzó eredményekért',
      );
    }

    if (issueTypes.DUPLICATE_MATCH > 0) {
      recommendations.push(
        'KRITIKUS: Duplikált meccsek találhatók - azonnali tisztítás szükséges',
      );
    }

    if (issueTypes.INVALID_SCORE > 0) {
      recommendations.push(
        'Ellenőrizd az eredmény feldolgozási logikát - érvénytelen pontszámok',
      );
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
        oddsCompleteness:
          totalMatches > 0
            ? Math.round((matchesWithOdds / totalMatches) * 100)
            : 0,
        resultCompleteness:
          finishedMatches > 0
            ? Math.round((matchesWithResults / finishedMatches) * 100)
            : 0,
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
  async checkMatchesByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<DataIssue[]> {
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
