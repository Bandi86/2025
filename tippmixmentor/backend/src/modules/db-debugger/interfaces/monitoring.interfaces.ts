// Core Database Monitoring Interfaces

export interface DatabaseEngine {
  type: 'postgresql' | 'mysql' | 'mongodb';
  version: string;
  host: string;
  port: number;
  database: string;
}

export interface QueryMetrics {
  id: string;
  query: string;
  executionTime: number;
  startTime: Date;
  endTime: Date;
  rowsAffected?: number;
  rowsReturned?: number;
  queryPlan?: QueryPlan;
  parameters?: any[];
  connectionId?: string;
  userId?: string;
  database: string;
  status: 'success' | 'error' | 'timeout';
  error?: string;
}

export interface QueryPlan {
  planType: string;
  totalCost: number;
  actualTime: number;
  estimatedRows: number;
  actualRows: number;
  nodes: QueryPlanNode[];
  indexes: IndexUsage[];
}

export interface QueryPlanNode {
  nodeType: string;
  relationName?: string;
  alias?: string;
  startupCost: number;
  totalCost: number;
  planRows: number;
  planWidth: number;
  actualTime: number;
  actualRows: number;
  actualLoops: number;
  children?: QueryPlanNode[];
}

export interface IndexUsage {
  indexName: string;
  tableName: string;
  used: boolean;
  scanType: 'index_scan' | 'bitmap_index_scan' | 'seq_scan';
  rowsFiltered: number;
  effectiveness: number; // 0-100 percentage
}

export interface ConnectionPoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  maxConnections: number;
  connectionUtilization: number; // percentage
  averageConnectionTime: number;
  connectionErrors: number;
  connectionTimeouts: number;
  timestamp: Date;
}

export interface TransactionMetrics {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'committed' | 'rolled_back' | 'aborted';
  isolationLevel: string;
  readOnly: boolean;
  queries: QueryMetrics[];
  locksHeld: DatabaseLock[];
  connectionId: string;
  userId?: string;
}

export interface DatabaseLock {
  lockType: 'row' | 'table' | 'page' | 'advisory';
  mode: 'shared' | 'exclusive' | 'update';
  resource: string;
  granted: boolean;
  waitTime?: number;
  holdTime?: number;
}

export interface DeadlockInfo {
  id: string;
  timestamp: Date;
  processes: DeadlockProcess[];
  resolution: 'victim_selected' | 'timeout' | 'manual';
  victimProcess?: string;
}

export interface DeadlockProcess {
  processId: string;
  query: string;
  locksHeld: DatabaseLock[];
  locksWaiting: DatabaseLock[];
  transactionId: string;
}

export interface PerformanceBottleneck {
  type: 'slow_query' | 'lock_contention' | 'index_missing' | 'connection_pool' | 'memory' | 'io';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedQueries?: string[];
  suggestedFix: string;
  impact: number; // 1-10 scale
  frequency: number; // occurrences per hour
  firstSeen: Date;
  lastSeen: Date;
}

export interface DatabaseMemoryMetrics {
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
  bufferCache: number;
  sharedBuffers: number;
  workMem: number;
  maintenanceWorkMem: number;
  effectiveCacheSize: number;
  memoryUtilization: number; // percentage
  timestamp: Date;
}

export interface SlowQueryConfig {
  enabled: boolean;
  threshold: number; // milliseconds
  logQueries: boolean;
  logQueryPlans: boolean;
  maxLogSize: number; // MB
  alertThreshold: number; // milliseconds
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'query_time' | 'connection_pool' | 'deadlock' | 'memory' | 'custom';
  condition: string; // SQL-like condition
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  cooldown: number; // minutes
  lastTriggered?: Date;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'slack';
  config: Record<string, any>;
}

export interface DatabaseAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface SchemaValidationResult {
  valid: boolean;
  issues: SchemaIssue[];
  recommendations: string[];
  lastChecked: Date;
}

export interface SchemaIssue {
  type: 'missing_index' | 'unused_index' | 'constraint_violation' | 'naming_convention' | 'data_type';
  severity: 'low' | 'medium' | 'high';
  table: string;
  column?: string;
  description: string;
  suggestedFix: string;
}

export interface MigrationInfo {
  id: string;
  name: string;
  version: string;
  appliedAt: Date;
  executionTime: number;
  status: 'success' | 'failed' | 'pending';
  rollbackAvailable: boolean;
  checksum: string;
}

export interface BackupVerification {
  id: string;
  backupFile: string;
  timestamp: Date;
  size: number;
  verified: boolean;
  verificationTime: number;
  issues: string[];
  restorable: boolean;
}

export interface DatabaseMetrics {
  timestamp: Date;
  queries: QueryMetrics[];
  connectionPool: ConnectionPoolMetrics;
  transactions: TransactionMetrics[];
  memory: DatabaseMemoryMetrics;
  bottlenecks: PerformanceBottleneck[];
  alerts: DatabaseAlert[];
}

export interface MonitoringConfig {
  enabled: boolean;
  queryMonitoring: {
    enabled: boolean;
    trackAllQueries: boolean;
    slowQueryThreshold: number;
  };
  connectionPoolMonitoring: {
    enabled: boolean;
    alertThreshold: number;
  };
  transactionMonitoring: {
    enabled: boolean;
    longTransactionThreshold: number;
  };
  deadlockDetection: {
    enabled: boolean;
    checkInterval: number;
  };
  memoryMonitoring: {
    enabled: boolean;
    alertThreshold: number;
  };
  alerting: {
    enabled: boolean;
    rules: AlertRule[];
  };
}

// Event interfaces for real-time monitoring
export interface DatabaseEvent {
  type: 'query_start' | 'query_end' | 'query_completed' | 'transaction_start' | 'transaction_end' | 'deadlock' | 'alert' | 'metrics_update';
  timestamp: Date;
  data: any;
}

export interface QueryOptimizationSuggestion {
  queryId: string;
  originalQuery: string;
  suggestedQuery?: string;
  type: 'index_suggestion' | 'query_rewrite' | 'parameter_tuning';
  description: string;
  expectedImprovement: number; // percentage
  confidence: number; // 0-100
  effort: 'low' | 'medium' | 'high';
}

// WebSocket event types for real-time dashboard
export interface WebSocketEvent {
  type: 'metrics_update' | 'alert' | 'query_completed' | 'deadlock_detected';
  data: any;
  timestamp: Date;
}