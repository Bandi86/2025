import {
  QueryMetrics,
  QueryPlan,
  ConnectionPoolMetrics,
  TransactionMetrics,
  DatabaseLock,
  DeadlockInfo,
  DatabaseMemoryMetrics,
  IndexUsage,
  SchemaValidationResult,
  MigrationInfo,
  BackupVerification,
  DatabaseEngine
} from './monitoring.interfaces';

export interface DatabaseAdapter {
  readonly engine: DatabaseEngine;

  // Connection and basic info
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getEngineInfo(): Promise<DatabaseEngine>;

  // Query monitoring
  executeQuery(query: string, params?: any[]): Promise<QueryMetrics>;
  getQueryPlan(query: string, params?: any[]): Promise<QueryPlan>;
  getActiveQueries(): Promise<QueryMetrics[]>;
  killQuery(queryId: string): Promise<boolean>;

  // Connection pool monitoring
  getConnectionPoolMetrics(): Promise<ConnectionPoolMetrics>;

  // Transaction monitoring
  getActiveTransactions(): Promise<TransactionMetrics[]>;
  getTransactionLocks(transactionId: string): Promise<DatabaseLock[]>;

  // Deadlock detection
  detectDeadlocks(): Promise<DeadlockInfo[]>;

  // Memory monitoring
  getMemoryMetrics(): Promise<DatabaseMemoryMetrics>;

  // Index analysis
  getIndexUsage(tableName?: string): Promise<IndexUsage[]>;
  getMissingIndexes(): Promise<string[]>;
  getUnusedIndexes(): Promise<string[]>;

  // Schema validation
  validateSchema(): Promise<SchemaValidationResult>;

  // Migration tracking
  getMigrationHistory(): Promise<MigrationInfo[]>;

  // Backup verification
  verifyBackup(backupPath: string): Promise<BackupVerification>;

  // Performance statistics
  getTableStatistics(tableName?: string): Promise<TableStatistics[]>;
  getDatabaseSize(): Promise<DatabaseSizeInfo>;

  // Configuration
  getDatabaseConfig(): Promise<Record<string, any>>;
  setDatabaseConfig(config: Record<string, any>): Promise<void>;
}

export interface TableStatistics {
  tableName: string;
  schemaName: string;
  rowCount: number;
  tableSize: number; // bytes
  indexSize: number; // bytes
  totalSize: number; // bytes
  lastAnalyzed?: Date;
  lastVacuumed?: Date;
  sequentialScans: number;
  indexScans: number;
  tuplesInserted: number;
  tuplesUpdated: number;
  tuplesDeleted: number;
}

export interface DatabaseSizeInfo {
  totalSize: number; // bytes
  dataSize: number; // bytes
  indexSize: number; // bytes
  logSize: number; // bytes
  tempSize: number; // bytes
  freeSpace: number; // bytes
}

// PostgreSQL specific adapter
export interface PostgreSQLAdapter extends DatabaseAdapter {
  // PostgreSQL specific methods
  getPostgreSQLStats(): Promise<PostgreSQLStats>;
  analyzeTables(tableNames?: string[]): Promise<void>;
  vacuumTables(tableNames?: string[], full?: boolean): Promise<void>;
  reindexTables(tableNames?: string[]): Promise<void>;
}

export interface PostgreSQLStats {
  version: string;
  uptime: number;
  connections: {
    total: number;
    active: number;
    idle: number;
    idleInTransaction: number;
    waiting: number;
  };
  buffers: {
    shared: number;
    temp: number;
    local: number;
  };
  checkpoints: {
    timed: number;
    requested: number;
    writeTime: number;
    syncTime: number;
  };
  bgwriter: {
    buffersClean: number;
    maxwriteClean: number;
    buffersBackend: number;
    buffersAlloc: number;
  };
}

// MySQL specific adapter
export interface MySQLAdapter extends DatabaseAdapter {
  // MySQL specific methods
  getMySQLStats(): Promise<MySQLStats>;
  optimizeTables(tableNames?: string[]): Promise<void>;
  repairTables(tableNames?: string[]): Promise<void>;
  flushTables(): Promise<void>;
}

export interface MySQLStats {
  version: string;
  uptime: number;
  threads: {
    connected: number;
    running: number;
    cached: number;
    created: number;
  };
  queries: {
    total: number;
    perSecond: number;
  };
  innodb: {
    bufferPoolSize: number;
    bufferPoolPages: {
      total: number;
      free: number;
      data: number;
      dirty: number;
    };
    logWrites: number;
    logWriteRequests: number;
  };
}

// MongoDB specific adapter
export interface MongoDBAdapter extends DatabaseAdapter {
  // MongoDB specific methods
  getMongoDBStats(): Promise<MongoDBStats>;
  getCollectionStats(collectionName?: string): Promise<MongoCollectionStats[]>;
  createIndex(collection: string, index: any): Promise<void>;
  dropIndex(collection: string, indexName: string): Promise<void>;
}

export interface MongoDBStats {
  version: string;
  uptime: number;
  connections: {
    current: number;
    available: number;
    totalCreated: number;
  };
  memory: {
    resident: number;
    virtual: number;
    mapped: number;
  };
  operations: {
    insert: number;
    query: number;
    update: number;
    delete: number;
    getmore: number;
    command: number;
  };
}

export interface MongoCollectionStats {
  name: string;
  count: number;
  size: number;
  avgObjSize: number;
  storageSize: number;
  indexes: number;
  totalIndexSize: number;
  indexSizes: Record<string, number>;
}

// Factory for creating database adapters
export interface DatabaseAdapterFactory {
  createAdapter(engine: DatabaseEngine): DatabaseAdapter;
  getSupportedEngines(): string[];
}

// Query formatter interface
export interface QueryFormatter {
  format(query: string, dialect: 'postgresql' | 'mysql' | 'mongodb'): string;
  highlight(query: string, dialect: 'postgresql' | 'mysql' | 'mongodb'): string;
  validate(query: string, dialect: 'postgresql' | 'mysql' | 'mongodb'): QueryValidationResult;
}

export interface QueryValidationResult {
  valid: boolean;
  errors: QueryError[];
  warnings: QueryWarning[];
}

export interface QueryError {
  line: number;
  column: number;
  message: string;
  code: string;
}

export interface QueryWarning {
  line: number;
  column: number;
  message: string;
  type: 'performance' | 'syntax' | 'best_practice';
}