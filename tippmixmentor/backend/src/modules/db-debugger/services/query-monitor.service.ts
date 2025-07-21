import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  QueryMetrics,
  DatabaseEvent,
  QueryOptimizationSuggestion,
  PerformanceBottleneck,
  SlowQueryConfig,
} from '../interfaces/monitoring.interfaces';
import { DatabaseAdapter } from '../interfaces/database-adapters.interface';
import { DbDebuggerConfig } from '../config/debugger.config';

@Injectable()
export class QueryMonitorService {
  private readonly logger = new Logger(QueryMonitorService.name);
  private activeQueries = new Map<string, QueryMetrics>();
  private queryHistory: QueryMetrics[] = [];
  private slowQueries: QueryMetrics[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(private readonly eventEmitter: EventEmitter) {}

  async startMonitoring(
    adapter: DatabaseAdapter,
    config: DbDebuggerConfig,
  ): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Query monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    this.logger.log('Starting query monitoring...');

    // Start periodic monitoring of active queries
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitorActiveQueries(adapter, config);
      } catch (error) {
        this.logger.error('Error monitoring active queries:', error);
      }
    }, 1000); // Check every second

    this.logger.log('Query monitoring started');
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.logger.log('Query monitoring stopped');
  }

  private async monitorActiveQueries(
    adapter: DatabaseAdapter,
    config: DbDebuggerConfig,
  ): Promise<void> {
    try {
      const activeQueries = await adapter.getActiveQueries();

      for (const query of activeQueries) {
        await this.processQuery(query, config);
      }

      // Clean up completed queries
      this.cleanupCompletedQueries(activeQueries);
    } catch (error) {
      this.logger.error('Failed to monitor active queries:', error);
    }
  }

  private async processQuery(
    query: QueryMetrics,
    config: DbDebuggerConfig,
  ): Promise<void> {
    const existingQuery = this.activeQueries.get(query.id);

    if (!existingQuery) {
      // New query detected
      this.activeQueries.set(query.id, query);

      this.eventEmitter.emit('query.started', {
        type: 'query_start',
        timestamp: query.startTime,
        data: query,
      } as DatabaseEvent);

      this.logger.debug(`New query started: ${query.id}`);
    } else {
      // Update existing query
      this.activeQueries.set(query.id, query);

      // Check if query is slow
      if (this.isSlowQuery(query, config.slowQuery)) {
        await this.handleSlowQuery(query, config);
      }
    }
  }

  private cleanupCompletedQueries(activeQueries: QueryMetrics[]): void {
    const activeQueryIds = new Set(activeQueries.map((q) => q.id));

    for (const [queryId, query] of this.activeQueries.entries()) {
      if (!activeQueryIds.has(queryId)) {
        // Query completed
        this.activeQueries.delete(queryId);
        this.addToHistory(query);

        this.eventEmitter.emit('query.completed', {
          type: 'query_end',
          timestamp: new Date(),
          data: query,
        } as DatabaseEvent);

        this.logger.debug(
          `Query completed: ${queryId} (${query.executionTime}ms)`,
        );
      }
    }
  }

  private isSlowQuery(query: QueryMetrics, config: SlowQueryConfig): boolean {
    return query.executionTime > config.threshold;
  }

  private async handleSlowQuery(
    query: QueryMetrics,
    config: DbDebuggerConfig,
  ): Promise<void> {
    if (!this.slowQueries.find((q) => q.id === query.id)) {
      this.slowQueries.push(query);

      if (config.slowQuery.logQueries) {
        this.logger.warn(
          `Slow query detected: ${query.id} (${query.executionTime}ms)`,
        );
        this.logger.warn(`Query: ${query.query}`);
      }

      // Emit slow query event
      this.eventEmitter.emit('query.slow', {
        type: 'query_completed',
        timestamp: new Date(),
        data: query,
      } as DatabaseEvent);

      // Generate optimization suggestions
      const suggestions = await this.generateOptimizationSuggestions(query);
      if (suggestions.length > 0) {
        this.eventEmitter.emit('query.optimization_suggestions', {
          queryId: query.id,
          suggestions,
        });
      }

      // Check for performance bottlenecks
      const bottlenecks = this.identifyPerformanceBottlenecks(query);
      if (bottlenecks.length > 0) {
        this.eventEmitter.emit('performance.bottlenecks', {
          queryId: query.id,
          bottlenecks,
        });
      }
    }
  }

  private addToHistory(query: QueryMetrics): void {
    this.queryHistory.push(query);

    // Keep only last 10000 queries in memory
    if (this.queryHistory.length > 10000) {
      this.queryHistory = this.queryHistory.slice(-10000);
    }
  }

  async executeAndMonitorQuery(
    adapter: DatabaseAdapter,
    query: string,
    params?: any[],
    config?: DbDebuggerConfig,
  ): Promise<QueryMetrics> {
    const startTime = new Date();

    this.eventEmitter.emit('query.started', {
      type: 'query_start',
      timestamp: startTime,
      data: { query, params },
    } as DatabaseEvent);

    try {
      const result = await adapter.executeQuery(query, params);

      // Add to history
      this.addToHistory(result);

      // Check if slow query
      if (config && this.isSlowQuery(result, config.slowQuery)) {
        await this.handleSlowQuery(result, config);
      }

      this.eventEmitter.emit('query.completed', {
        type: 'query_end',
        timestamp: result.endTime,
        data: result,
      } as DatabaseEvent);

      return result;
    } catch (error) {
      const endTime = new Date();
      const errorResult: QueryMetrics = {
        id: `error-${Date.now()}`,
        query,
        executionTime: endTime.getTime() - startTime.getTime(),
        startTime,
        endTime,
        parameters: params,
        database: adapter.engine.database,
        status: 'error',
        error: error.message,
      };

      this.addToHistory(errorResult);

      this.eventEmitter.emit('query.error', {
        type: 'query_end',
        timestamp: endTime,
        data: errorResult,
      } as DatabaseEvent);

      throw error;
    }
  }

  private async generateOptimizationSuggestions(
    query: QueryMetrics,
  ): Promise<QueryOptimizationSuggestion[]> {
    const suggestions: QueryOptimizationSuggestion[] = [];
    const queryText = query.query.toLowerCase();

    // Basic optimization suggestions based on query patterns
    if (queryText.includes('select *')) {
      suggestions.push({
        queryId: query.id,
        originalQuery: query.query,
        type: 'query_rewrite',
        description: 'Avoid SELECT * - specify only needed columns',
        expectedImprovement: 15,
        confidence: 80,
        effort: 'low',
      });
    }

    if (queryText.includes('order by') && !queryText.includes('limit')) {
      suggestions.push({
        queryId: query.id,
        originalQuery: query.query,
        type: 'query_rewrite',
        description: 'Consider adding LIMIT clause to ORDER BY queries',
        expectedImprovement: 25,
        confidence: 70,
        effort: 'low',
      });
    }

    if (queryText.includes("like '%") && queryText.includes("%'")) {
      suggestions.push({
        queryId: query.id,
        originalQuery: query.query,
        type: 'index_suggestion',
        description:
          'LIKE queries with leading wildcards cannot use indexes efficiently',
        expectedImprovement: 40,
        confidence: 90,
        effort: 'medium',
      });
    }

    if (queryText.includes('in (select')) {
      suggestions.push({
        queryId: query.id,
        originalQuery: query.query,
        type: 'query_rewrite',
        description: 'Consider using EXISTS instead of IN with subquery',
        expectedImprovement: 20,
        confidence: 75,
        effort: 'medium',
      });
    }

    // Check for missing indexes based on WHERE clauses
    const whereMatch = queryText.match(/where\s+(\w+)\s*=/);
    if (whereMatch && query.executionTime > 1000) {
      suggestions.push({
        queryId: query.id,
        originalQuery: query.query,
        type: 'index_suggestion',
        description: `Consider adding index on column: ${whereMatch[1]}`,
        expectedImprovement: 60,
        confidence: 85,
        effort: 'low',
      });
    }

    return suggestions;
  }

  private identifyPerformanceBottlenecks(
    query: QueryMetrics,
  ): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    const now = new Date();

    if (query.executionTime > 5000) {
      bottlenecks.push({
        type: 'slow_query',
        severity: 'high',
        description: `Query execution time (${query.executionTime}ms) exceeds 5 seconds`,
        affectedQueries: [query.id],
        suggestedFix: 'Optimize query or add appropriate indexes',
        impact: Math.min(10, Math.floor(query.executionTime / 1000)),
        frequency: 1,
        firstSeen: now,
        lastSeen: now,
      });
    }

    if (query.queryPlan) {
      // Analyze query plan for bottlenecks
      const hasSeqScan = this.hasSequentialScan(query.queryPlan);
      if (hasSeqScan && query.executionTime > 1000) {
        bottlenecks.push({
          type: 'index_missing',
          severity: 'medium',
          description: 'Query uses sequential scan on large table',
          affectedQueries: [query.id],
          suggestedFix: 'Add appropriate indexes to avoid sequential scans',
          impact: 7,
          frequency: 1,
          firstSeen: now,
          lastSeen: now,
        });
      }
    }

    return bottlenecks;
  }

  private hasSequentialScan(queryPlan: any): boolean {
    // Recursively check for sequential scans in query plan
    const checkNode = (node: any): boolean => {
      if (node.nodeType === 'Seq Scan') {
        return true;
      }
      if (node.children) {
        return node.children.some((child: any) => checkNode(child));
      }
      return false;
    };

    return queryPlan.nodes.some((node: any) => checkNode(node));
  }

  // Public methods for accessing monitoring data
  getActiveQueries(): QueryMetrics[] {
    return Array.from(this.activeQueries.values());
  }

  getQueryHistory(limit = 100): QueryMetrics[] {
    return this.queryHistory.slice(-limit);
  }

  getSlowQueries(limit = 50): QueryMetrics[] {
    return this.slowQueries
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  getQueryStatistics(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueryCount: number;
    errorCount: number;
    activeQueryCount: number;
  } {
    const totalQueries = this.queryHistory.length;
    const averageExecutionTime =
      totalQueries > 0
        ? this.queryHistory.reduce((sum, q) => sum + q.executionTime, 0) /
          totalQueries
        : 0;
    const slowQueryCount = this.slowQueries.length;
    const errorCount = this.queryHistory.filter(
      (q) => q.status === 'error',
    ).length;
    const activeQueryCount = this.activeQueries.size;

    return {
      totalQueries,
      averageExecutionTime: Math.round(averageExecutionTime),
      slowQueryCount,
      errorCount,
      activeQueryCount,
    };
  }

  async killQuery(adapter: DatabaseAdapter, queryId: string): Promise<boolean> {
    try {
      const result = await adapter.killQuery(queryId);

      if (result) {
        this.activeQueries.delete(queryId);
        this.logger.log(`Query ${queryId} killed successfully`);

        this.eventEmitter.emit('query.killed', {
          type: 'query_end',
          timestamp: new Date(),
          data: { queryId },
        } as DatabaseEvent);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to kill query ${queryId}:`, error);
      return false;
    }
  }

  clearHistory(): void {
    this.queryHistory = [];
    this.slowQueries = [];
    this.logger.log('Query history cleared');
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}
