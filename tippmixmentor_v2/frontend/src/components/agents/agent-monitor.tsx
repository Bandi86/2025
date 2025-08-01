'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Cpu, 
  HardDrive,
  Network, 
  Database,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  disk: number;
  activeConnections: number;
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
}

export function AgentMonitor() {
  // Mock system metrics
  const [metrics, setMetrics] = React.useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    network: 28,
    disk: 34,
    activeConnections: 156,
    totalRequests: 2847,
    errorRate: 2.3,
    averageResponseTime: 245
  });

  // Simulate real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(85, prev.memory + (Math.random() - 0.5) * 5)),
        network: Math.max(5, Math.min(60, prev.network + (Math.random() - 0.5) * 8)),
        disk: Math.max(15, Math.min(70, prev.disk + (Math.random() - 0.5) * 3)),
        activeConnections: Math.max(100, Math.min(200, prev.activeConnections + Math.floor((Math.random() - 0.5) * 20))),
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
        errorRate: Math.max(0.1, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.5)),
        averageResponseTime: Math.max(100, Math.min(500, prev.averageResponseTime + (Math.random() - 0.5) * 20))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <XCircle className="w-4 h-4 text-red-600" />;
    if (value >= thresholds.warning) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>System Monitor</span>
          </CardTitle>
          <CardDescription>
            Real-time monitoring of agent system resources and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                {getStatusIcon(metrics.cpu, { warning: 70, critical: 85 })}
              </div>
              <Progress 
                value={metrics.cpu} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current</span>
                <span className={getStatusColor(metrics.cpu, { warning: 70, critical: 85 })}>
                  {metrics.cpu.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                {getStatusIcon(metrics.memory, { warning: 75, critical: 90 })}
              </div>
              <Progress 
                value={metrics.memory} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current</span>
                <span className={getStatusColor(metrics.memory, { warning: 75, critical: 90 })}>
                  {metrics.memory.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Network Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Network</span>
                </div>
                {getStatusIcon(metrics.network, { warning: 50, critical: 70 })}
              </div>
              <Progress 
                value={metrics.network} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current</span>
                <span className={getStatusColor(metrics.network, { warning: 50, critical: 70 })}>
                  {metrics.network.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Disk Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Disk Usage</span>
                </div>
                {getStatusIcon(metrics.disk, { warning: 80, critical: 90 })}
              </div>
              <Progress 
                value={metrics.disk} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current</span>
                <span className={getStatusColor(metrics.disk, { warning: 80, critical: 90 })}>
                  {metrics.disk.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Network className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold">{metrics.activeConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold">{metrics.errorRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{metrics.averageResponseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">System Healthy</p>
                <p className="text-sm text-green-700">All critical systems operational</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Performance Good</p>
                <p className="text-sm text-blue-700">Response times within normal range</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">1 Agent Warning</p>
                <p className="text-sm text-yellow-700">Value Detection Agent needs attention</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 