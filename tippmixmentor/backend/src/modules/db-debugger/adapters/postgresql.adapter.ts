import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';
import {
  PostgreSQLAdapter,
  PostgreSQLStats,
  TableStatistics,
  DatabaseSizeInfo,
} from '../interfaces/database-adapters.interface';
import {
  QueryMetrics,
  QueryPlan,
  QueryPlanNode,
  ConnectionPoolMetrics,
  TransactionMetrics,
  DatabaseLock,
  DeadlockInfo,
  DeadlockProcess,
  DatabaseMemoryMetrics,
  IndexUsage,
  SchemaValidationResult,
  SchemaIssue,
  MigrationInfo,
  BackupVerification,
  DatabaseEngine,
} from '../interfaces/monitoring.interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PostgreSQLAdapterService implements PostgreSQLAdapter {
  private readonly logger = new Logger(PostgreSQLAdapterService.name);
  private pool: Pool;
  private connected = false;

  readonly engine: DatabaseEngine = {
    type: 'postgresql',
    version: '',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'postgres',
  };

  constructor() {
    this.initializePool();
  }

  private initializePool(): void {
    this.pool = new Pool({
      host: this.engine.host,
      port: this.engine.port,
      database: this.engine.database,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      this.logger.error('PostgreSQL pool error:', err);
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT version()');
      this.engine.version = result.rows[0].version;
      client.release();
      this.connected = true;
      this.logger.log('Connected to PostgreSQL');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
      this.logger.log('Disconnected from PostgreSQL');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getEngineInfo(): Promise<DatabaseEngine> {
    if (!this.connected) {
      await this.connect();
    }
    return this.engine;
  }

  async executeQuery(query: string, params?: any[]): Promise<QueryMetrics> {
    const queryId = uuidv4();
    const startTime = new Date();
    let client: PoolClient;

    try {
      client = await this.pool.connect();
      const result = await client.query(query, params);
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      client.release();

      return {
        id: queryId,
        query,
        executionTime,
        startTime,
        endTime,
        rowsAffected: result.rowCount || 0,
        rowsReturned: result.rows?.length || 0,
        parameters: params,
        connectionId: (client as any).processID?.toString(),
        database: this.engine.database,
        status: 'success',
      };
    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      if (client!) {
        client.release();
      }

      return {
        id: queryId,
        query,
        executionTime,
        startTime,
        endTime,
        parameters: params,
        database: this.engine.database,
        status: 'error',
        error: error.message,
      };
    }
  }

  async getQueryPlan(query: string, params?: any[]): Promise<QueryPlan> {
    const client = await this.pool.connect();
    try {
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await client.query(explainQuery, params);
      const planData = result.rows[0]['QUERY PLAN'][0];

      return this.parsePostgreSQLPlan(planData);
    } finally {
      client.release();
    }
  }

  private parsePostgreSQLPlan(planData: any): QueryPlan {
    const plan = planData.Plan;

    return {
      planType: 'PostgreSQL',
      totalCost: plan['Total Cost'],
      actualTime: plan['Actual Total Time'],
      estimatedRows: plan['Plan Rows'],
      actualRows: plan['Actual Rows'],
      nodes: [this.parsePostgreSQLPlanNode(plan)],
      indexes: this.extractIndexUsage(plan),
    };
  }

  private parsePostgreSQLPlanNode(node: any): QueryPlanNode {
    return {
      nodeType: node['Node Type'],
      relationName: node['Relation Name'],
      alias: node['Alias'],
      startupCost: node['Startup Cost'],
      totalCost: node['Total Cost'],
      planRows: node['Plan Rows'],
      planWidth: node['Plan Width'],
      actualTime: node['Actual Total Time'],
      actualRows: node['Actual Rows'],
      actualLoops: node['Actual Loops'],
      children: node.Plans?.map((child: any) => this.parsePostgreSQLPlanNode(child)) || [],
    };
  }

  private extractIndexUsage(plan: any): IndexUsage[] {
    const indexes: IndexUsage[] = [];

    const extractFromNode = (node: any) => {
      if (node['Index Name']) {
        indexes.push({
          indexName: node['Index Name'],
          tableName: node['Relation Name'] || '',
          used: true,
          scanType: node['Node Type'].toLowerCase().includes('index') ? 'index_scan' : 'seq_scan',
          rowsFiltered: node['Rows Removed by Filter'] || 0,
          effectiveness: this.calculateIndexEffectiveness(node),
        });
      }

      if (node.Plans) {
        node.Plans.forEach((child: any) => extractFromNode(child));
      }
    };

    extractFromNode(plan);
    return indexes;
  }

  private calculateIndexEffectiveness(node: any): number {
    const actualRows = node['Actual Rows'] || 0;
    const planRows = node['Plan Rows'] || 0;
    const rowsFiltered = node['Rows Removed by Filter'] || 0;

    if (planRows === 0) return 100;

    const efficiency = Math.max(0, 100 - (rowsFiltered / planRows) * 100);
    return Math.round(efficiency);
  }

  async getActiveQueries(): Promise<QueryMetrics[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          pid,
          query,
          state,
          query_start,
          now() - query_start as duration,
          datname,
          usename
        FROM pg_stat_activity
        WHERE state = 'active'
          AND query != '<IDLE>'
          AND pid != pg_backend_pid()
      `);

      return result.rows.map(row => ({
        id: row.pid.toString(),
        query: row.query,
        executionTime: this.parseDuration(row.duration),
        startTime: row.query_start,
        endTime: new Date(),
        database: row.datname,
        status: 'success' as const,
        connectionId: row.pid.toString(),
        userId: row.usename,
      }));
    } finally {
      client.release();
    }
  }

  private parseDuration(duration: string): number {
    // Parse PostgreSQL interval to milliseconds
    const match = duration.match(/(\d+):(\d+):(\d+)\.(\d+)/);
    if (match) {
      const [, hours, minutes, seconds, milliseconds] = match;
      return (
        parseInt(hours) * 3600000 +
        parseInt(minutes) * 60000 +
        parseInt(seconds) * 1000 +
        parseInt(milliseconds.padEnd(3, '0').substring(0, 3))
      );
    }
    return 0;
  }

  async killQuery(queryId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT pg_terminate_backend($1)', [parseInt(queryId)]);
      return result.rows[0].pg_terminate_backend;
    } finally {
      client.release();
    }
  }

  async getConnectionPoolMetrics(): Promise<ConnectionPoolMetrics> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting_connections
        FROM pg_stat_activity
      `);

      const settingsResult = await client.query("SHOW max_connections");
      const maxConnections = parseInt(settingsResult.rows[0].max_connections);

      const row = result.rows[0];
      const totalConnections = parseInt(row.total_connections);
      const activeConnections = parseInt(row.active_connections);
      const idleConnections = parseInt(row.idle_connections);
      const waitingConnections = parseInt(row.waiting_connections);

      return {
        totalConnections,
        activeConnections,
        idleConnections,
        waitingConnections,
        maxConnections,
        connectionUtilization: Math.round((totalConnections / maxConnections) * 100),
        averageConnectionTime: 0, // Would need historical data
        connectionErrors: 0, // Would need to track separately
        connectionTimeouts: 0, // Would need to track separately
        timestamp: new Date(),
      };
    } finally {
      client.release();
    }
  }

  async getActiveTransactions(): Promise<TransactionMetrics[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          pid,
          xact_start,
          query_start,
          state,
          query,
          datname,
          usename
        FROM pg_stat_activity
        WHERE xact_start IS NOT NULL
          AND pid != pg_backend_pid()
      `);

      const transactions: TransactionMetrics[] = [];

      for (const row of result.rows) {
        const locks = await this.getTransactionLocks(row.pid.toString());

        transactions.push({
          id: row.pid.toString(),
          startTime: row.xact_start,
          status: 'active',
          isolationLevel: 'READ COMMITTED', // Default, would need to query per transaction
          readOnly: false, // Would need to determine from query analysis
          queries: [{
            id: uuidv4(),
            query: row.query,
            executionTime: Date.now() - new Date(row.query_start).getTime(),
            startTime: row.query_start,
            endTime: new Date(),
            database: row.datname,
            status: 'success',
          }],
          locksHeld: locks,
          connectionId: row.pid.toString(),
          userId: row.usename,
        });
      }

      return transactions;
    } finally {
      client.release();
    }
  }

  async getTransactionLocks(transactionId: string): Promise<DatabaseLock[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          locktype,
          mode,
          granted,
          relation::regclass as relation_name
        FROM pg_locks
        WHERE pid = $1
      `, [parseInt(transactionId)]);

      return result.rows.map(row => ({
        lockType: this.mapPostgreSQLLockType(row.locktype),
        mode: this.mapPostgreSQLLockMode(row.mode),
        resource: row.relation_name || row.locktype,
        granted: row.granted,
      }));
    } finally {
      client.release();
    }
  }

  private mapPostgreSQLLockType(locktype: string): 'row' | 'table' | 'page' | 'advisory' {
    switch (locktype) {
      case 'tuple':
        return 'row';
      case 'relation':
        return 'table';
      case 'page':
        return 'page';
      case 'advisory':
        return 'advisory';
      default:
        return 'table';
    }
  }

  private mapPostgreSQLLockMode(mode: string): 'shared' | 'exclusive' | 'update' {
    if (mode.includes('Exclusive')) return 'exclusive';
    if (mode.includes('Update')) return 'update';
    return 'shared';
  }

  async detectDeadlocks(): Promise<DeadlockInfo[]> {
    // PostgreSQL doesn't store historical deadlock information by default
    // This would require enabling deadlock logging and parsing log files
    // For now, return empty array - in production, you'd implement log parsing
    return [];
  }

  async getMemoryMetrics(): Promise<DatabaseMemoryMetrics> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          setting as shared_buffers
        FROM pg_settings
        WHERE name = 'shared_buffers'
      `);

      const sharedBuffers = this.parseMemorySize(result.rows[0].shared_buffers);

      // Get buffer cache statistics
      const bufferResult = await client.query(`
        SELECT
          sum(case when isdirty then 1 else 0 end) as dirty_buffers,
          count(*) as total_buffers
        FROM pg_buffercache
      `);

      return {
        totalMemory: 0, // Would need system-level query
        usedMemory: 0, // Would need system-level query
        freeMemory: 0, // Would need system-level query
        bufferCache: sharedBuffers,
        sharedBuffers,
        workMem: 0, // Would query from pg_settings
        maintenanceWorkMem: 0, // Would query from pg_settings
        effectiveCacheSize: 0, // Would query from pg_settings
        memoryUtilization: 0, // Would calculate based on system memory
        timestamp: new Date(),
      };
    } finally {
      client.release();
    }
  }

  private parseMemorySize(sizeStr: string): number {
    const match = sizeStr.match(/(\d+)(\w+)?/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2]?.toLowerCase() || '';

    switch (unit) {
      case 'kb': return value * 1024;
      case 'mb': return value * 1024 * 1024;
      case 'gb': return value * 1024 * 1024 * 1024;
      default: return value;
    }
  }

  async getIndexUsage(tableName?: string): Promise<IndexUsage[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
      `;

      const params: any[] = [];
      if (tableName) {
        query += ' WHERE tablename = $1';
        params.push(tableName);
      }

      const result = await client.query(query, params);

      return result.rows.map(row => ({
        indexName: row.indexname,
        tableName: row.tablename,
        used: row.idx_scan > 0,
        scanType: 'index_scan' as const,
        rowsFiltered: 0,
        effectiveness: this.calculateIndexUsageEffectiveness(row),
      }));
    } finally {
      client.release();
    }
  }

  private calculateIndexUsageEffectiveness(row: any): number {
    const scans = parseInt(row.idx_scan) || 0;
    const tuplesRead = parseInt(row.idx_tup_read) || 0;
    const tuplesFetched = parseInt(row.idx_tup_fetch) || 0;

    if (scans === 0) return 0;
    if (tuplesRead === 0) return 100;

    const efficiency = (tuplesFetched / tuplesRead) * 100;
    return Math.round(Math.min(100, efficiency));
  }

  async getMissingIndexes(): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      // This is a simplified approach - in practice, you'd analyze query patterns
      const result = await client.query(`
        SELECT
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          n_tup_ins + n_tup_upd + n_tup_del as modifications
        FROM pg_stat_user_tables
        WHERE seq_scan > idx_scan * 2
          AND seq_tup_read > 10000
        ORDER BY seq_tup_read DESC
      `);

      return result.rows.map(row =>
        `Consider adding index to ${row.schemaname}.${row.tablename} (${row.seq_scan} seq scans, ${row.seq_tup_read} rows read)`
      );
    } finally {
      client.release();
    }
  }

  async getUnusedIndexes(): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        ORDER BY schemaname, tablename, indexname
      `);

      return result.rows.map(row =>
        `${row.schemaname}.${row.tablename}.${row.indexname} (never used)`
      );
    } finally {
      client.release();
    }
  }

  async validateSchema(): Promise<SchemaValidationResult> {
    const client = await this.pool.connect();
    try {
      const issues: SchemaIssue[] = [];

      // Check for tables without primary keys
      const noPkResult = await client.query(`
        SELECT table_name
        FROM information_schema.tables t
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            WHERE tc.table_name = t.table_name
              AND tc.constraint_type = 'PRIMARY KEY'
          )
      `);

      noPkResult.rows.forEach(row => {
        issues.push({
          type: 'constraint_violation',
          severity: 'high',
          table: row.table_name,
          description: `Table ${row.table_name} has no primary key`,
          suggestedFix: `ALTER TABLE ${row.table_name} ADD PRIMARY KEY (id)`,
        });
      });

      // Check for unused indexes
      const unusedIndexes = await this.getUnusedIndexes();
      unusedIndexes.forEach(indexInfo => {
        issues.push({
          type: 'unused_index',
          severity: 'medium',
          table: indexInfo.split('.')[1],
          description: `Unused index: ${indexInfo}`,
          suggestedFix: `Consider dropping unused index`,
        });
      });

      const recommendations = this.generateSchemaRecommendations(issues);

      return {
        valid: issues.length === 0,
        issues,
        recommendations,
        lastChecked: new Date(),
      };
    } finally {
      client.release();
    }
  }

  private generateSchemaRecommendations(issues: SchemaIssue[]): string[] {
    const recommendations: string[] = [];

    const highSeverityCount = issues.filter(i => i.severity === 'high').length;
    const unusedIndexCount = issues.filter(i => i.type === 'unused_index').length;

    if (highSeverityCount > 0) {
      recommendations.push(`Address ${highSeverityCount} high-severity schema issues immediately`);
    }

    if (unusedIndexCount > 5) {
      recommendations.push(`Consider dropping ${unusedIndexCount} unused indexes to improve performance`);
    }

    if (issues.length === 0) {
      recommendations.push('Schema validation passed - no issues found');
    }

    return recommendations;
  }

  async getMigrationHistory(): Promise<MigrationInfo[]> {
    const client = await this.pool.connect();
    try {
      // Assuming Prisma migrations table
      const result = await client.query(`
        SELECT
          id,
          checksum,
          finished_at,
          migration_name,
          rolled_back_at
        FROM _prisma_migrations
        ORDER BY finished_at DESC
      `);

      return result.rows.map(row => ({
        id: row.id,
        name: row.migration_name,
        version: row.id.substring(0, 14), // Extract timestamp part
        appliedAt: row.finished_at,
        executionTime: 0, // Not stored in Prisma migrations
        status: row.rolled_back_at ? 'failed' : 'success',
        rollbackAvailable: false, // Prisma doesn't support automatic rollbacks
        checksum: row.checksum,
      }));
    } catch (error) {
      // If migrations table doesn't exist, return empty array
      return [];
    } finally {
      client.release();
    }
  }

  async verifyBackup(backupPath: string): Promise<BackupVerification> {
    // This would typically involve:
    // 1. Checking if backup file exists and is readable
    // 2. Validating backup format
    // 3. Potentially doing a test restore to a temporary database
    // For now, return a mock implementation

    return {
      id: uuidv4(),
      backupFile: backupPath,
      timestamp: new Date(),
      size: 0, // Would get actual file size
      verified: false, // Would perform actual verification
      verificationTime: 0,
      issues: ['Backup verification not implemented'],
      restorable: false,
    };
  }

  async getTableStatistics(tableName?: string): Promise<TableStatistics[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT
          schemaname,
          tablename,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup,
          n_dead_tup,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch
        FROM pg_stat_user_tables
      `;

      const params: any[] = [];
      if (tableName) {
        query += ' WHERE tablename = $1';
        params.push(tableName);
      }

      const result = await client.query(query, params);
      const statistics: TableStatistics[] = [];

      for (const row of result.rows) {
        // Get table size information
        const sizeResult = await client.query(`
          SELECT
            pg_total_relation_size($1) as total_size,
            pg_relation_size($1) as table_size,
            pg_indexes_size($1) as index_size
        `, [`${row.schemaname}.${row.tablename}`]);

        const sizeRow = sizeResult.rows[0];

        statistics.push({
          tableName: row.tablename,
          schemaName: row.schemaname,
          rowCount: parseInt(row.n_live_tup) || 0,
          tableSize: parseInt(sizeRow.table_size) || 0,
          indexSize: parseInt(sizeRow.index_size) || 0,
          totalSize: parseInt(sizeRow.total_size) || 0,
          lastAnalyzed: row.last_analyze || row.last_autoanalyze,
          lastVacuumed: row.last_vacuum || row.last_autovacuum,
          sequentialScans: parseInt(row.seq_scan) || 0,
          indexScans: parseInt(row.idx_scan) || 0,
          tuplesInserted: parseInt(row.n_tup_ins) || 0,
          tuplesUpdated: parseInt(row.n_tup_upd) || 0,
          tuplesDeleted: parseInt(row.n_tup_del) || 0,
        });
      }

      return statistics;
    } finally {
      client.release();
    }
  }

  async getDatabaseSize(): Promise<DatabaseSizeInfo> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          pg_database_size(current_database()) as total_size
      `);

      const totalSize = parseInt(result.rows[0].total_size);

      // Get breakdown by object type
      const breakdownResult = await client.query(`
        SELECT
          sum(pg_relation_size(oid)) as data_size,
          sum(pg_indexes_size(oid)) as index_size
        FROM pg_class
        WHERE relkind IN ('r', 'p')
      `);

      const breakdown = breakdownResult.rows[0];

      return {
        totalSize,
        dataSize: parseInt(breakdown.data_size) || 0,
        indexSize: parseInt(breakdown.index_size) || 0,
        logSize: 0, // Would need to query WAL size
        tempSize: 0, // Would need to query temp file usage
        freeSpace: 0, // Would need filesystem-level query
      };
    } finally {
      client.release();
    }
  }

  async getDatabaseConfig(): Promise<Record<string, any>> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT name, setting, unit, category, short_desc
        FROM pg_settings
        WHERE category NOT LIKE 'Preset%'
        ORDER BY category, name
      `);

      const config: Record<string, any> = {};
      result.rows.forEach(row => {
        config[row.name] = {
          value: row.setting,
          unit: row.unit,
          category: row.category,
          description: row.short_desc,
        };
      });

      return config;
    } finally {
      client.release();
    }
  }

  async setDatabaseConfig(config: Record<string, any>): Promise<void> {
    const client = await this.pool.connect();
    try {
      for (const [key, value] of Object.entries(config)) {
        await client.query(`ALTER SYSTEM SET ${key} = $1`, [value]);
      }
      await client.query('SELECT pg_reload_conf()');
    } finally {
      client.release();
    }
  }

  // PostgreSQL-specific methods
  async getPostgreSQLStats(): Promise<PostgreSQLStats> {
    const client = await this.pool.connect();
    try {
      const versionResult = await client.query('SELECT version()');
      const uptimeResult = await client.query(`
        SELECT extract(epoch from now() - pg_postmaster_start_time()) as uptime
      `);

      const connectionsResult = await client.query(`
        SELECT
          count(*) as total,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting
        FROM pg_stat_activity
      `);

      const bgwriterResult = await client.query(`
        SELECT
          checkpoints_timed,
          checkpoints_req,
          checkpoint_write_time,
          checkpoint_sync_time,
          buffers_clean,
          maxwritten_clean,
          buffers_backend,
          buffers_alloc
        FROM pg_stat_bgwriter
      `);

      const connections = connectionsResult.rows[0];
      const bgwriter = bgwriterResult.rows[0];

      return {
        version: versionResult.rows[0].version,
        uptime: parseFloat(uptimeResult.rows[0].uptime),
        connections: {
          total: parseInt(connections.total),
          active: parseInt(connections.active),
          idle: parseInt(connections.idle),
          idleInTransaction: parseInt(connections.idle_in_transaction),
          waiting: parseInt(connections.waiting),
        },
        buffers: {
          shared: 0, // Would need to query shared_buffers setting
          temp: 0, // Would need to query temp buffer usage
          local: 0, // Would need to query local buffer usage
        },
        checkpoints: {
          timed: parseInt(bgwriter.checkpoints_timed),
          requested: parseInt(bgwriter.checkpoints_req),
          writeTime: parseFloat(bgwriter.checkpoint_write_time),
          syncTime: parseFloat(bgwriter.checkpoint_sync_time),
        },
        bgwriter: {
          buffersClean: parseInt(bgwriter.buffers_clean),
          maxwriteClean: parseInt(bgwriter.maxwritten_clean),
          buffersBackend: parseInt(bgwriter.buffers_backend),
          buffersAlloc: parseInt(bgwriter.buffers_alloc),
        },
      };
    } finally {
      client.release();
    }
  }

  async analyzeTables(tableNames?: string[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      if (tableNames && tableNames.length > 0) {
        for (const tableName of tableNames) {
          await client.query(`ANALYZE ${tableName}`);
        }
      } else {
        await client.query('ANALYZE');
      }
    } finally {
      client.release();
    }
  }

  async vacuumTables(tableNames?: string[], full?: boolean): Promise<void> {
    const client = await this.pool.connect();
    try {
      const vacuumCommand = full ? 'VACUUM FULL' : 'VACUUM';

      if (tableNames && tableNames.length > 0) {
        for (const tableName of tableNames) {
          await client.query(`${vacuumCommand} ${tableName}`);
        }
      } else {
        await client.query(vacuumCommand);
      }
    } finally {
      client.release();
    }
  }

  async reindexTables(tableNames?: string[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      if (tableNames && tableNames.length > 0) {
        for (const tableName of tableNames) {
          await client.query(`REINDEX TABLE ${tableName}`);
        }
      } else {
        await client.query('REINDEX DATABASE CONCURRENTLY');
      }
    } finally {
      client.release();
    }
  }
}

// Export the class for use in modules
export { PostgreSQLAdapter };
