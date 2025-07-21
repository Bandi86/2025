import { MonitoringConfig, SlowQueryConfig, AlertRule } from '../interfaces/monitoring.interfaces';

export interface DbDebuggerConfig {
  monitoring: MonitoringConfig;
  slowQuery: SlowQueryConfig;
  realtime: RealtimeConfig;
  dashboard: DashboardConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  integrations: IntegrationsConfig;
}

export interface RealtimeConfig {
  enabled: boolean;
  websocketPort: number;
  maxConnections: number;
  heartbeatInterval: number; // seconds
  bufferSize: number; // number of events to buffer
}

export interface DashboardConfig {
  enabled: boolean;
  refreshInterval: number; // seconds
  maxDataPoints: number;
  retentionPeriod: number; // days
  charts: {
    queryTime: boolean;
    connectionPool: boolean;
    memory: boolean;
    transactions: boolean;
  };
}

export interface StorageConfig {
  metricsRetention: number; // days
  slowQueryLogRetention: number; // days
  alertHistoryRetention: number; // days
  maxLogFileSize: number; // MB
  compressionEnabled: boolean;
  backupEnabled: boolean;
  backupInterval: number; // hours
}

export interface SecurityConfig {
  authentication: {
    enabled: boolean;
    type: 'jwt' | 'basic' | 'oauth';
    secretKey?: string;
  };
  authorization: {
    enabled: boolean;
    roles: string[];
  };
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  encryption: {
    enabled: boolean;
    algorithm: string;
  };
}

export interface IntegrationsConfig {
  webhooks: WebhookConfig[];
  email: EmailConfig;
  slack: SlackConfig;
  prometheus: PrometheusConfig;
  grafana: GrafanaConfig;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  events: string[];
  headers?: Record<string, string>;
  retryAttempts: number;
  timeout: number; // seconds
}

export interface EmailConfig {
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: string;
  templates: {
    alert: string;
    report: string;
  };
}

export interface SlackConfig {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  username: string;
  iconEmoji: string;
}

export interface PrometheusConfig {
  enabled: boolean;
  endpoint: string;
  pushGateway?: string;
  labels: Record<string, string>;
}

export interface GrafanaConfig {
  enabled: boolean;
  url: string;
  apiKey: string;
  dashboardId?: string;
}

// Default configuration
export const DEFAULT_CONFIG: DbDebuggerConfig = {
  monitoring: {
    enabled: true,
    queryMonitoring: {
      enabled: true,
      trackAllQueries: false,
      slowQueryThreshold: 1000, // 1 second
    },
    connectionPoolMonitoring: {
      enabled: true,
      alertThreshold: 80, // 80% utilization
    },
    transactionMonitoring: {
      enabled: true,
      longTransactionThreshold: 30000, // 30 seconds
    },
    deadlockDetection: {
      enabled: true,
      checkInterval: 5000, // 5 seconds
    },
    memoryMonitoring: {
      enabled: true,
      alertThreshold: 85, // 85% utilization
    },
    alerting: {
      enabled: true,
      rules: [],
    },
  },
  slowQuery: {
    enabled: true,
    threshold: 1000, // 1 second
    logQueries: true,
    logQueryPlans: true,
    maxLogSize: 100, // 100 MB
    alertThreshold: 5000, // 5 seconds
  },
  realtime: {
    enabled: true,
    websocketPort: 3001,
    maxConnections: 100,
    heartbeatInterval: 30,
    bufferSize: 1000,
  },
  dashboard: {
    enabled: true,
    refreshInterval: 5,
    maxDataPoints: 1000,
    retentionPeriod: 30,
    charts: {
      queryTime: true,
      connectionPool: true,
      memory: true,
      transactions: true,
    },
  },
  storage: {
    metricsRetention: 30,
    slowQueryLogRetention: 7,
    alertHistoryRetention: 90,
    maxLogFileSize: 100,
    compressionEnabled: true,
    backupEnabled: true,
    backupInterval: 24,
  },
  security: {
    authentication: {
      enabled: false,
      type: 'jwt',
    },
    authorization: {
      enabled: false,
      roles: ['admin', 'viewer'],
    },
    rateLimiting: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    },
    encryption: {
      enabled: false,
      algorithm: 'aes-256-gcm',
    },
  },
  integrations: {
    webhooks: [],
    email: {
      enabled: false,
      smtp: {
        host: '',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: '',
        },
      },
      from: '',
      templates: {
        alert: 'default-alert-template',
        report: 'default-report-template',
      },
    },
    slack: {
      enabled: false,
      webhookUrl: '',
      channel: '#alerts',
      username: 'DB Debugger',
      iconEmoji: ':warning:',
    },
    prometheus: {
      enabled: false,
      endpoint: '/metrics',
      labels: {
        service: 'db-debugger',
      },
    },
    grafana: {
      enabled: false,
      url: '',
      apiKey: '',
    },
  },
};

// Default alert rules
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'slow-query-alert',
    name: 'Slow Query Alert',
    type: 'query_time',
    condition: 'execution_time > 5000',
    threshold: 5000,
    severity: 'warning',
    enabled: true,
    cooldown: 5,
    actions: [
      {
        type: 'log',
        config: { level: 'warn' },
      },
    ],
  },
  {
    id: 'connection-pool-alert',
    name: 'Connection Pool High Utilization',
    type: 'connection_pool',
    condition: 'utilization > 90',
    threshold: 90,
    severity: 'error',
    enabled: true,
    cooldown: 10,
    actions: [
      {
        type: 'log',
        config: { level: 'error' },
      },
    ],
  },
  {
    id: 'deadlock-alert',
    name: 'Deadlock Detected',
    type: 'deadlock',
    condition: 'deadlock_count > 0',
    threshold: 0,
    severity: 'critical',
    enabled: true,
    cooldown: 1,
    actions: [
      {
        type: 'log',
        config: { level: 'error' },
      },
    ],
  },
  {
    id: 'memory-alert',
    name: 'High Memory Usage',
    type: 'memory',
    condition: 'memory_utilization > 90',
    threshold: 90,
    severity: 'warning',
    enabled: true,
    cooldown: 15,
    actions: [
      {
        type: 'log',
        config: { level: 'warn' },
      },
    ],
  },
];

// Configuration validation
export function validateConfig(config: Partial<DbDebuggerConfig>): string[] {
  const errors: string[] = [];

  if (config.monitoring?.queryMonitoring?.slowQueryThreshold !== undefined) {
    if (config.monitoring.queryMonitoring.slowQueryThreshold < 0) {
      errors.push('slowQueryThreshold must be non-negative');
    }
  }

  if (config.monitoring?.connectionPoolMonitoring?.alertThreshold !== undefined) {
    const threshold = config.monitoring.connectionPoolMonitoring.alertThreshold;
    if (threshold < 0 || threshold > 100) {
      errors.push('connectionPoolMonitoring alertThreshold must be between 0 and 100');
    }
  }

  if (config.realtime?.websocketPort !== undefined) {
    const port = config.realtime.websocketPort;
    if (port < 1 || port > 65535) {
      errors.push('websocketPort must be between 1 and 65535');
    }
  }

  if (config.storage?.metricsRetention !== undefined) {
    if (config.storage.metricsRetention < 1) {
      errors.push('metricsRetention must be at least 1 day');
    }
  }

  return errors;
}

// Environment-based configuration loader
export function loadConfigFromEnv(): Partial<DbDebuggerConfig> {
  return {
    monitoring: {
      enabled: process.env.DB_DEBUGGER_ENABLED === 'true',
      queryMonitoring: {
        enabled: process.env.DB_DEBUGGER_QUERY_MONITORING === 'true',
        trackAllQueries: process.env.DB_DEBUGGER_TRACK_ALL_QUERIES === 'true',
        slowQueryThreshold: parseInt(process.env.DB_DEBUGGER_SLOW_QUERY_THRESHOLD || '1000'),
      },
      connectionPoolMonitoring: {
        enabled: process.env.DB_DEBUGGER_CONNECTION_MONITORING === 'true',
        alertThreshold: parseInt(process.env.DB_DEBUGGER_CONNECTION_ALERT_THRESHOLD || '80'),
      },
      transactionMonitoring: {
        enabled: process.env.DB_DEBUGGER_TRANSACTION_MONITORING === 'true',
        longTransactionThreshold: parseInt(process.env.DB_DEBUGGER_LONG_TRANSACTION_THRESHOLD || '30000'),
      },
      deadlockDetection: {
        enabled: process.env.DB_DEBUGGER_DEADLOCK_DETECTION === 'true',
        checkInterval: parseInt(process.env.DB_DEBUGGER_DEADLOCK_CHECK_INTERVAL || '5000'),
      },
      memoryMonitoring: {
        enabled: process.env.DB_DEBUGGER_MEMORY_MONITORING === 'true',
        alertThreshold: parseInt(process.env.DB_DEBUGGER_MEMORY_ALERT_THRESHOLD || '85'),
      },
      alerting: {
        enabled: process.env.DB_DEBUGGER_ALERTING === 'true',
        rules: [],
      },
    },
    realtime: {
      enabled: process.env.DB_DEBUGGER_REALTIME === 'true',
      websocketPort: parseInt(process.env.DB_DEBUGGER_WEBSOCKET_PORT || '3001'),
      maxConnections: parseInt(process.env.DB_DEBUGGER_MAX_CONNECTIONS || '100'),
      heartbeatInterval: parseInt(process.env.DB_DEBUGGER_HEARTBEAT_INTERVAL || '30'),
      bufferSize: parseInt(process.env.DB_DEBUGGER_BUFFER_SIZE || '1000'),
    },
    integrations: {
      webhooks: [],
      email: {
        enabled: process.env.DB_DEBUGGER_EMAIL_ENABLED === 'true',
        smtp: {
          host: process.env.DB_DEBUGGER_SMTP_HOST || '',
          port: parseInt(process.env.DB_DEBUGGER_SMTP_PORT || '587'),
          secure: process.env.DB_DEBUGGER_SMTP_SECURE === 'true',
          auth: {
            user: process.env.DB_DEBUGGER_SMTP_USER || '',
            pass: process.env.DB_DEBUGGER_SMTP_PASS || '',
          },
        },
        from: process.env.DB_DEBUGGER_EMAIL_FROM || '',
        templates: {
          alert: 'default-alert-template',
          report: 'default-report-template',
        },
      },
      slack: {
        enabled: process.env.DB_DEBUGGER_SLACK_ENABLED === 'true',
        webhookUrl: process.env.DB_DEBUGGER_SLACK_WEBHOOK_URL || '',
        channel: process.env.DB_DEBUGGER_SLACK_CHANNEL || '#alerts',
        username: process.env.DB_DEBUGGER_SLACK_USERNAME || 'DB Debugger',
        iconEmoji: process.env.DB_DEBUGGER_SLACK_ICON || ':warning:',
      },
      prometheus: {
        enabled: process.env.DB_DEBUGGER_PROMETHEUS_ENABLED === 'true',
        endpoint: process.env.DB_DEBUGGER_PROMETHEUS_ENDPOINT || '/metrics',
        pushGateway: process.env.DB_DEBUGGER_PROMETHEUS_PUSH_GATEWAY,
        labels: {
          service: 'db-debugger',
        },
      },
      grafana: {
        enabled: process.env.DB_DEBUGGER_GRAFANA_ENABLED === 'true',
        url: process.env.DB_DEBUGGER_GRAFANA_URL || '',
        apiKey: process.env.DB_DEBUGGER_GRAFANA_API_KEY || '',
        dashboardId: process.env.DB_DEBUGGER_GRAFANA_DASHBOARD_ID,
      },
    },
  };
}