'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { RefreshCw, Activity, Database, Server, Brain } from 'lucide-react';
import { useHealthStatus, usePerformanceMetrics } from '@/hooks/use-api';

interface HealthStatusProps {
  showMetrics?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function HealthStatus({ 
  showMetrics = true, 
  autoRefresh = false, 
  refreshInterval = 30000 
}: HealthStatusProps) {
  const { 
    data: health, 
    isLoading: healthLoading, 
    error: healthError, 
    refetch: refetchHealth 
  } = useHealthStatus();

  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    error: metricsError 
  } = usePerformanceMetrics();

  const loading = healthLoading || (showMetrics && metricsLoading);
  const error = healthError || (showMetrics && metricsError);

  const getStatusColor = (status: 'healthy' | 'unhealthy') => {
    return status === 'healthy' ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusIcon = (status: 'healthy' | 'unhealthy') => {
    return status === 'healthy' ? '🟢' : '🔴';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading && !health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Checking system health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️ Connection Error</div>
              <div className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Failed to fetch health data'}
              </div>
              <Button onClick={() => refetchHealth()} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Backend services status and performance metrics
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => refetchHealth()} 
              size="sm" 
              variant="outline"
              disabled={healthLoading}
            >
              <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        {health && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getStatusIcon(health.status)}</span>
                <span className="font-medium">Overall Status</span>
              </div>
              <Badge 
                variant={health.status === 'healthy' ? 'default' : 'destructive'}
                className="text-sm"
              >
                {health.status.toUpperCase()}
              </Badge>
            </div>

            {/* Service Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium text-sm">Database</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(health.services.database)}`} />
                    <span className="text-xs text-muted-foreground">
                      {health.services.database}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Server className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium text-sm">Redis Cache</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(health.services.redis)}`} />
                    <span className="text-xs text-muted-foreground">
                      {health.services.redis}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Brain className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-medium text-sm">ML Service</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(health.services.ml_service)}`} />
                    <span className="text-xs text-muted-foreground">
                      {health.services.ml_service}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Uptime:</span>
                <span className="ml-2 font-medium">{formatUptime(health.uptime)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Version:</span>
                <span className="ml-2 font-medium">{health.version}</span>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {showMetrics && metrics && (
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatResponseTime(metrics.responseTime)}
                </div>
                <div className="text-xs text-muted-foreground">Response Time</div>
              </div>

              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.requestsPerSecond.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Requests/sec</div>
              </div>

              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(metrics.errorRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Error Rate</div>
              </div>

              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.activeConnections}
                </div>
                <div className="text-xs text-muted-foreground">Active Connections</div>
              </div>

              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </div>
                <div className="text-xs text-muted-foreground">Memory Usage</div>
              </div>

              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {(metrics.cpuUsage * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">CPU Usage</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 