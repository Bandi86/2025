'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  Settings, 
  Eye,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export interface Agent {
  id: string;
  name: string;
  description: string;
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
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onConfigure: (id: string) => void;
  onViewDetails: (agent: Agent) => void;
}

export function AgentCard({ 
  agent, 
  onStart, 
  onStop, 
  onConfigure, 
  onViewDetails 
}: AgentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'starting': return 'bg-blue-100 text-blue-800';
      case 'stopping': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-emerald-100 text-emerald-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {agent.description}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(agent.status)}>
              {agent.status}
            </Badge>
            <Badge className={getHealthColor(agent.health)}>
              {agent.health}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-lg font-semibold">{agent.performance.accuracy}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-lg font-semibold">{agent.performance.responseTime}ms</p>
              </div>
            </div>
          </div>

          {/* Tasks Progress */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Tasks Completed</span>
              <span>{agent.performance.tasksCompleted} / {agent.performance.tasksCompleted + agent.performance.tasksFailed}</span>
            </div>
            <Progress 
              value={(agent.performance.tasksCompleted / (agent.performance.tasksCompleted + agent.performance.tasksFailed)) * 100} 
              className="h-2"
            />
          </div>

          {/* Last Active */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last active: {formatTimeAgo(agent.lastActive)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              {agent.status === 'active' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStop(agent.id)}
                  className="flex items-center space-x-1"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStart(agent.id)}
                  className="flex items-center space-x-1"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigure(agent.id)}
                className="flex items-center space-x-1"
              >
                <Settings className="w-4 h-4" />
                <span>Configure</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(agent)}
              className="flex items-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span>Details</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 