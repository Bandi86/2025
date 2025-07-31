'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Settings, 
  Activity, 
  Brain, 
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  MessageSquare,
  FileText,
  Calendar,
  Target,
  Timer,
  Users,
  Globe
} from 'lucide-react';
import { Agent } from './agent-card';

interface AgentTask {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

interface AgentEvent {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface AgentInsight {
  id: string;
  type: string;
  content: string;
  confidence: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface AgentDetailsProps {
  agent: Agent;
  onBack: () => void;
  onStart?: (agentId: string) => void;
  onStop?: (agentId: string) => void;
  onConfigure?: (agentId: string) => void;
}

export function AgentDetails({ 
  agent, 
  onBack, 
  onStart, 
  onStop, 
  onConfigure 
}: AgentDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Mock data - in real app, this would come from API
  const [tasks] = useState<AgentTask[]>([
    {
      id: '1',
      type: 'prediction_analysis',
      status: 'completed',
      priority: 'high',
      createdAt: new Date(Date.now() - 3600000),
      startedAt: new Date(Date.now() - 3500000),
      completedAt: new Date(Date.now() - 3000000),
      result: { accuracy: 0.85, confidence: 0.92 }
    },
    {
      id: '2',
      type: 'data_collection',
      status: 'running',
      priority: 'medium',
      createdAt: new Date(Date.now() - 1800000),
      startedAt: new Date(Date.now() - 1700000)
    },
    {
      id: '3',
      type: 'model_training',
      status: 'pending',
      priority: 'low',
      createdAt: new Date(Date.now() - 900000)
    }
  ]);

  const [events] = useState<AgentEvent[]>([
    {
      id: '1',
      type: 'task_completed',
      severity: 'info',
      message: 'Prediction analysis completed successfully',
      timestamp: new Date(Date.now() - 3000000)
    },
    {
      id: '2',
      type: 'data_source_updated',
      severity: 'info',
      message: 'New match data available',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: '3',
      type: 'performance_alert',
      severity: 'warning',
      message: 'Response time increased by 20%',
      timestamp: new Date(Date.now() - 900000)
    }
  ]);

  const [insights] = useState<AgentInsight[]>([
    {
      id: '1',
      type: 'market_trend',
      content: 'Home team advantage is stronger in evening matches',
      confidence: 0.87,
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      type: 'performance_optimization',
      content: 'Model accuracy improves with additional historical data',
      confidence: 0.92,
      createdAt: new Date(Date.now() - 7200000)
    }
  ]);

  const handleStart = async () => {
    if (onStart) {
      setIsStarting(true);
      try {
        await onStart(agent.id);
      } finally {
        setIsStarting(false);
      }
    }
  };

  const handleStop = async () => {
    if (onStop) {
      setIsStopping(true);
      try {
        await onStop(agent.id);
      } finally {
        setIsStopping(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'starting': return 'bg-yellow-500';
      case 'stopping': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'critical': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-gray-600">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
              {agent.status}
            </Badge>
          </div>
          {agent.status === 'active' ? (
            <Button
              variant="outline"
              onClick={handleStop}
              disabled={isStopping}
              className="flex items-center space-x-2"
            >
              <Pause className="w-4 h-4" />
              <span>{isStopping ? 'Stopping...' : 'Stop'}</span>
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isStarting ? 'Starting...' : 'Start'}</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onConfigure?.(agent.id)}
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Agent Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Agent Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium">{agent.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Health</span>
                  <Badge variant={agent.health === 'healthy' ? 'default' : 'destructive'}>
                    {agent.health}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">
                    {agent.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Active</span>
                  <span className="font-medium">
                    {agent.lastActive.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Accuracy</span>
                    <span>{agent.performance.accuracy}%</span>
                  </div>
                  <Progress value={agent.performance.accuracy} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span>{agent.performance.tasksCompleted} completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>{agent.performance.tasksFailed} failed</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Response Time</span>
                    <span>{agent.performance.responseTime}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Tasks</span>
                  <span className="font-medium">
                    {tasks.filter(t => t.status === 'running').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Tasks</span>
                  <span className="font-medium">
                    {tasks.filter(t => t.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent Events</span>
                  <span className="font-medium">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Insights Generated</span>
                  <span className="font-medium">{insights.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Recent Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Target className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{task.type}</div>
                        <div className="text-sm text-gray-600">
                          Created {task.createdAt.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{task.priority}</Badge>
                      <Badge 
                        variant={task.status === 'completed' ? 'default' : 'secondary'}
                        className={getTaskStatusColor(task.status)}
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Recent Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map(event => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{event.message}</div>
                      <div className="text-sm text-gray-600">
                        {event.timestamp.toLocaleString()} • {event.type}
                      </div>
                    </div>
                    <Badge variant={event.severity === 'error' || event.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {event.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>AI Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map(insight => (
                  <div key={insight.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{insight.type}</Badge>
                      <div className="text-sm text-gray-600">
                        {insight.createdAt.toLocaleString()}
                      </div>
                    </div>
                    <p className="text-gray-900 mb-3">{insight.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <span className="font-medium">{insight.confidence * 100}%</span>
                      </div>
                      <Progress value={insight.confidence * 100} className="w-24 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy Trend</span>
                      <span>+5.2%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Response Time</span>
                      <span>-12ms</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Task Success Rate</span>
                      <span>+2.1%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Timer className="w-5 h-5" />
                  <span>Activity Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Task completed</div>
                      <div className="text-xs text-gray-600">2 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Data collection started</div>
                      <div className="text-xs text-gray-600">15 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Performance alert</div>
                      <div className="text-xs text-gray-600">1 hour ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 