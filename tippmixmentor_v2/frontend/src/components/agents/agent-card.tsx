'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Settings, 
  Activity, 
  Brain, 
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: 'active' | 'inactive' | 'error' | 'starting' | 'stopping';
  health: 'healthy' | 'warning' | 'critical';
  performance: {
    accuracy: number;
    responseTime: number;
    tasksCompleted: number;
    tasksFailed: number;
  };
  lastActive: Date;
  createdAt: Date;
  config?: Record<string, any>;
}

interface AgentCardProps {
  agent: Agent;
  onStart?: (agentId: string) => void;
  onStop?: (agentId: string) => void;
  onConfigure?: (agentId: string) => void;
  onViewDetails?: (agent: Agent) => void;
  className?: string;
}

export function AgentCard({ 
  agent, 
  onStart, 
  onStop, 
  onConfigure, 
  onViewDetails,
  className 
}: AgentCardProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'starting': return 'bg-yellow-500';
      case 'stopping': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (health: Agent['health']) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: Agent['health']) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

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

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{agent.name}</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {agent.type} • {agent.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
              {agent.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Health Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`${getHealthColor(agent.health)}`}>
              {getHealthIcon(agent.health)}
            </span>
            <span className="text-sm font-medium">Health</span>
          </div>
          <Badge variant={agent.health === 'healthy' ? 'default' : 'destructive'}>
            {agent.health}
          </Badge>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Accuracy</span>
            <span className="font-medium">{agent.performance.accuracy}%</span>
          </div>
          <Progress value={agent.performance.accuracy} className="h-2" />
          
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
        </div>

        {/* Last Active */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Last active</span>
          <span>{formatLastActive(agent.lastActive)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex space-x-2">
            {agent.status === 'active' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={isStopping}
                className="flex items-center space-x-1"
              >
                <Pause className="w-4 h-4" />
                <span>{isStopping ? 'Stopping...' : 'Stop'}</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStart}
                disabled={isStarting}
                className="flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>{isStarting ? 'Starting...' : 'Start'}</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConfigure?.(agent.id)}
              className="flex items-center space-x-1"
            >
              <Settings className="w-4 h-4" />
              <span>Configure</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
                            onClick={() => onViewDetails?.(agent)}
            className="flex items-center space-x-1"
          >
            <Activity className="w-4 h-4" />
            <span>Details</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 