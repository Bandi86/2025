'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAgentStore } from '@/stores/agent-store';
import { useAgentWebSocket } from '@/hooks/use-agent-websocket';

interface AgentMonitorProps {
  className?: string;
}

export function AgentMonitor({ className }: AgentMonitorProps) {
  const { agents, agentEvents, agentTasks } = useAgentStore();
  const { isConnected } = useAgentWebSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get recent events from all agents
  const recentEvents = Object.values(agentEvents)
    .flat()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  // Get active tasks from all agents
  const activeTasks = Object.values(agentTasks)
    .flat()
    .filter(task => task.status === 'running')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate system metrics
  const systemMetrics = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    healthyAgents: agents.filter(a => a.health === 'healthy').length,
    errorAgents: agents.filter(a => a.status === 'error').length,
    totalTasks: Object.values(agentTasks).flat().length,
    runningTasks: activeTasks.length,
    completedTasks: Object.values(agentTasks).flat().filter(t => t.status === 'completed').length,
    failedTasks: Object.values(agentTasks).flat().filter(t => t.status === 'failed').length,
    averageAccuracy: agents.length > 0 
      ? Math.round(agents.reduce((sum, agent) => sum + agent.performance.accuracy, 0) / agents.length)
      : 0
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'agent_started':
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'agent_error':
      case 'task_failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'performance_alert':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'prediction_analysis':
        return <BarChart3 className="w-4 h-4" />;
      case 'data_collection':
        return <Target className="w-4 h-4" />;
      case 'model_training':
        return <Brain className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Agent System Monitor</CardTitle>
                <CardDescription>
                  Real-time monitoring of AI agents and their activities
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemMetrics.totalAgents}</div>
              <div className="text-sm text-gray-600">Total Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemMetrics.activeAgents}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{systemMetrics.runningTasks}</div>
              <div className="text-sm text-gray-600">Running Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{systemMetrics.averageAccuracy}%</div>
              <div className="text-sm text-gray-600">Avg Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Active Tasks</span>
              <Badge variant="secondary">{activeTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTasks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No active tasks</p>
                </div>
              ) : (
                activeTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getTaskIcon(task.type)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{task.type.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">
                          Started {formatTimeAgo(task.startedAt || task.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Recent Events</span>
              <Badge variant="secondary">{recentEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No recent events</p>
                </div>
              ) : (
                recentEvents.map(event => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="mt-1">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{event.message}</div>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(event.timestamp)} • {event.type.replace('_', ' ')}
                      </div>
                    </div>
                    <Badge 
                      variant={event.severity === 'error' || event.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {event.severity}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Performance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Task Success Rate</span>
                <span className="text-sm text-gray-600">
                  {systemMetrics.totalTasks > 0 
                    ? Math.round((systemMetrics.completedTasks / systemMetrics.totalTasks) * 100)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={systemMetrics.totalTasks > 0 
                  ? (systemMetrics.completedTasks / systemMetrics.totalTasks) * 100
                  : 0
                } 
                className="h-2" 
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">System Health</span>
                <span className="text-sm text-gray-600">
                  {systemMetrics.totalAgents > 0 
                    ? Math.round((systemMetrics.healthyAgents / systemMetrics.totalAgents) * 100)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={systemMetrics.totalAgents > 0 
                  ? (systemMetrics.healthyAgents / systemMetrics.totalAgents) * 100
                  : 0
                } 
                className="h-2" 
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Agent Utilization</span>
                <span className="text-sm text-gray-600">
                  {systemMetrics.totalAgents > 0 
                    ? Math.round((systemMetrics.activeAgents / systemMetrics.totalAgents) * 100)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={systemMetrics.totalAgents > 0 
                  ? (systemMetrics.activeAgents / systemMetrics.totalAgents) * 100
                  : 0
                } 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 