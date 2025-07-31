'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { AgentList } from '@/components/agents/agent-list';
import { AgentDetails } from '@/components/agents/agent-details';
import { AgentInsights } from '@/components/predictions/agent-insights';
import { AgentMonitor } from '@/components/agents/agent-monitor';
import { useAgentStore } from '@/stores/agent-store';
import { useAgentWebSocket } from '@/hooks/use-agent-websocket';
import { Agent } from '@/components/agents/agent-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Plus, 
  Wifi, 
  WifiOff, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Users
} from 'lucide-react';

function AgentsContent() {
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  const {
    agents,
    isLoading,
    error,
    startAgent,
    stopAgent,
    createAgent,
    deleteAgent,
    setSelectedAgent: setStoreSelectedAgent
  } = useAgentStore();

  const { isConnected, subscribeToAllAgents } = useAgentWebSocket();

  // Load mock agents on mount
  useEffect(() => {
    if (agents.length === 0) {
      const mockAgents: Agent[] = [
        {
          id: 'agent-1',
          name: 'Market Analysis Agent',
          description: 'Analyzes market trends and betting patterns',
          type: 'market_analysis',
          status: 'active',
          health: 'healthy',
          performance: {
            accuracy: 87,
            responseTime: 245,
            tasksCompleted: 156,
            tasksFailed: 3
          },
          lastActive: new Date(Date.now() - 300000),
          createdAt: new Date(Date.now() - 86400000 * 7)
        },
        {
          id: 'agent-2',
          name: 'Risk Assessment Agent',
          description: 'Evaluates risk levels and volatility',
          type: 'risk_assessment',
          status: 'active',
          health: 'healthy',
          performance: {
            accuracy: 92,
            responseTime: 189,
            tasksCompleted: 89,
            tasksFailed: 1
          },
          lastActive: new Date(Date.now() - 600000),
          createdAt: new Date(Date.now() - 86400000 * 5)
        },
        {
          id: 'agent-3',
          name: 'Value Detection Agent',
          description: 'Identifies undervalued betting opportunities',
          type: 'value_detection',
          status: 'inactive',
          health: 'warning',
          performance: {
            accuracy: 78,
            responseTime: 312,
            tasksCompleted: 67,
            tasksFailed: 8
          },
          lastActive: new Date(Date.now() - 3600000),
          createdAt: new Date(Date.now() - 86400000 * 3)
        },
        {
          id: 'agent-4',
          name: 'Prediction Optimization Agent',
          description: 'Optimizes prediction models and algorithms',
          type: 'prediction_optimization',
          status: 'active',
          health: 'healthy',
          performance: {
            accuracy: 85,
            responseTime: 156,
            tasksCompleted: 234,
            tasksFailed: 5
          },
          lastActive: new Date(Date.now() - 120000),
          createdAt: new Date(Date.now() - 86400000 * 10)
        },
        {
          id: 'agent-5',
          name: 'Strategy Optimization Agent',
          description: 'Optimizes betting strategies and bankroll management',
          type: 'strategy_optimization',
          status: 'error',
          health: 'critical',
          performance: {
            accuracy: 0,
            responseTime: 0,
            tasksCompleted: 0,
            tasksFailed: 12
          },
          lastActive: new Date(Date.now() - 7200000),
          createdAt: new Date(Date.now() - 86400000 * 2)
        }
      ];

      mockAgents.forEach(agent => {
        useAgentStore.getState().addAgent(agent);
      });
    }
  }, [agents.length]);

  // Subscribe to all agents when WebSocket connects
  useEffect(() => {
    if (isConnected && agents.length > 0) {
      subscribeToAllAgents();
    }
  }, [isConnected, agents.length]); // Remove subscribeToAllAgents from dependencies

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setStoreSelectedAgent(agent);
    setView('details');
  };

  const handleBackToList = () => {
    setSelectedAgent(null);
    setStoreSelectedAgent(null);
    setView('list');
  };

  const handleCreateAgent = () => {
    // In a real app, this would open a modal or navigate to a create form
    createAgent({
      name: 'New Agent',
      description: 'A new AI agent',
      type: 'prediction'
    });
  };

  const handleConfigure = (agentId: string) => {
    // In a real app, this would open a configuration modal
    console.log('Configure agent:', agentId);
  };

  const getSystemStatus = () => {
    const activeAgents = agents.filter(a => a.status === 'active').length;
    const totalAgents = agents.length;
    const healthyAgents = agents.filter(a => a.health === 'healthy').length;
    const errorAgents = agents.filter(a => a.status === 'error').length;

    return {
      activeAgents,
      totalAgents,
      healthyAgents,
      errorAgents,
      healthPercentage: totalAgents > 0 ? Math.round((healthyAgents / totalAgents) * 100) : 0
    };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your AI agents for football predictions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={handleCreateAgent} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Agent</span>
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold">{systemStatus.totalAgents}</p>
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
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold">{systemStatus.activeAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Health</p>
                <p className="text-2xl font-bold">{systemStatus.healthPercentage}%</p>
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
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold">{systemStatus.errorAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {view === 'list' ? (
        <div className="space-y-6">
          {/* Agent Monitor */}
          <AgentMonitor />
          
          {/* Agent List */}
          <AgentList
            agents={agents}
            onStart={startAgent}
            onStop={stopAgent}
            onConfigure={handleConfigure}
            onViewDetails={handleViewDetails}
            onCreateAgent={handleCreateAgent}
            isLoading={isLoading}
          />
          
          {/* Agent Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Agent Insights</span>
              </CardTitle>
              <CardDescription>
                AI agent performance and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgentInsights />
            </CardContent>
          </Card>
        </div>
      ) : (
        <AgentDetails
          agent={selectedAgent!}
          onBack={handleBackToList}
          onStart={startAgent}
          onStop={stopAgent}
          onConfigure={handleConfigure}
        />
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <AgentsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 