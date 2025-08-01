'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { AgentList } from '@/components/agents/agent-list';
import { AgentDetails } from '@/components/agents/agent-details';
import { AgentInsights } from '@/components/predictions/agent-insights';
import { AgentMonitor } from '@/components/agents/agent-monitor';
import { useAgentStatus } from '@/hooks/use-dashboard-data';
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
  
  const { agents, loading, error } = useAgentStatus(30000);

  const { isConnected, subscribeToAllAgents } = useAgentWebSocket();

  // Convert dashboard agent data to Agent format
  const convertedAgents: Agent[] = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    description: `${agent.type} agent for football predictions`,
    type: agent.type,
    status: agent.status === 'online' ? 'active' : agent.status === 'busy' ? 'active' : 'inactive',
    health: agent.status === 'online' ? 'healthy' : agent.status === 'error' ? 'critical' : 'warning',
    performance: {
      accuracy: agent.accuracy,
      responseTime: agent.performance?.avgResponseTime || 0,
      tasksCompleted: agent.predictionsMade,
      tasksFailed: Math.floor(agent.predictionsMade * (1 - agent.accuracy / 100))
    },
    lastActive: new Date(agent.lastActivity),
    createdAt: new Date(Date.now() - 86400000 * 7) // Mock creation date
  }));

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setView('details');
  };

  const handleBackToList = () => {
    setSelectedAgent(null);
    setView('list');
  };

  const handleCreateAgent = () => {
    console.log('Create agent clicked');
    // This would open a modal or navigate to create agent page
  };

  const handleConfigure = (agentId: string) => {
    console.log('Configure agent:', agentId);
    // This would open configuration modal
  };

  const getSystemStatus = () => {
    const activeAgents = convertedAgents.filter(agent => agent.status === 'active').length;
    const totalAgents = convertedAgents.length;
    const healthyAgents = convertedAgents.filter(agent => agent.health === 'healthy').length;
    const errorAgents = convertedAgents.filter(agent => agent.health === 'critical').length;

    return {
      active: activeAgents,
      total: totalAgents,
      healthy: healthyAgents,
      errorAgents,
      connection: isConnected ? 'connected' : 'disconnected'
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
                <p className="text-2xl font-bold">{systemStatus.total}</p>
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
                <p className="text-2xl font-bold">{systemStatus.active}</p>
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
                <p className="text-2xl font-bold">{systemStatus.healthy}%</p>
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
            agents={convertedAgents}
            onStart={() => console.log('Start agent')}
            onStop={() => console.log('Stop agent')}
            onConfigure={handleConfigure}
            onViewDetails={handleViewDetails}
            onCreateAgent={handleCreateAgent}
            isLoading={loading}
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
          onStart={() => console.log('Start agent')}
          onStop={() => console.log('Stop agent')}
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