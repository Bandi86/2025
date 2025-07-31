import { useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './use-websocket';
import { useAgentStore } from '@/stores/agent-store';
import { useAuth } from './use-auth';

interface AgentWebSocketMessage {
  type: 'agent_update' | 'agent_event' | 'agent_task_update' | 'agent_insight' | 'agent_status_change';
  agentId: string;
  data: any;
  timestamp: string;
}

export function useAgentWebSocket() {
  const { user } = useAuth();
  const {
    handleAgentUpdate,
    handleAgentEvent,
    handleAgentTaskUpdate,
    handleAgentInsight,
    agents
  } = useAgentStore();

  const { socket, isConnected, connect, disconnect } = useWebSocket();
  const subscribedAgents = useRef<Set<string>>(new Set());

  // Subscribe to agent updates
  const subscribeToAgent = useCallback((agentId: string) => {
    if (!socket || !isConnected) return;

    if (!subscribedAgents.current.has(agentId)) {
      socket.emit('joinAgent', agentId);
      subscribedAgents.current.add(agentId);
      console.log(`Subscribed to agent: ${agentId}`);
    }
  }, [socket, isConnected]);

  // Unsubscribe from agent updates
  const unsubscribeFromAgent = useCallback((agentId: string) => {
    if (!socket || !isConnected) return;

    if (subscribedAgents.current.has(agentId)) {
      socket.emit('leaveAgent', agentId);
      subscribedAgents.current.delete(agentId);
      console.log(`Unsubscribed from agent: ${agentId}`);
    }
  }, [socket, isConnected]);

  // Subscribe to all agents
  const subscribeToAllAgents = useCallback(() => {
    agents.forEach(agent => {
      subscribeToAgent(agent.id);
    });
  }, [agents, subscribeToAgent]);

  // Send agent command
  const sendAgentCommand = useCallback((agentId: string, command: string, payload?: any) => {
    if (!socket || !isConnected) {
      console.warn('WebSocket not connected, cannot send agent command');
      return;
    }

    socket.emit('agentCommand', {
      agentId,
      command,
      payload,
      timestamp: new Date().toISOString()
    });
  }, [socket, isConnected]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: AgentWebSocketMessage) => {
      console.log('Agent WebSocket message received:', message);

      switch (message.type) {
        case 'agent_update':
          handleAgentUpdate(message.agentId, message.data);
          break;
        
        case 'agent_event':
          handleAgentEvent(message.agentId, message.data);
          break;
        
        case 'agent_task_update':
          handleAgentTaskUpdate(message.agentId, message.data);
          break;
        
        case 'agent_insight':
          handleAgentInsight(message.agentId, message.data);
          break;
        
        case 'agent_status_change':
          handleAgentUpdate(message.agentId, { status: message.data.status });
          break;
        
        default:
          console.warn('Unknown agent WebSocket message type:', message.type);
      }
    };

    // Listen for agent-specific events
    socket.on('agentUpdate', handleMessage);
    socket.on('agentEvent', handleMessage);
    socket.on('agentTaskUpdate', handleMessage);
    socket.on('agentInsight', handleMessage);
    socket.on('agentStatusChange', handleMessage);

    // Listen for general agent events
    socket.on('agentError', (data: { agentId: string; error: any }) => {
      console.error('Agent error received:', data);
      handleAgentEvent(data.agentId, {
        id: Date.now().toString(),
        agentId: data.agentId,
        type: 'agent_error',
        severity: 'error',
        message: data.error.message || 'Agent encountered an error',
        timestamp: new Date(),
        metadata: data.error
      });
    });

    socket.on('agentHealthUpdate', (data: { agentId: string; health: any }) => {
      console.log('Agent health update:', data);
      handleAgentUpdate(data.agentId, { health: data.health.status });
    });

    socket.on('agentPerformanceUpdate', (data: { agentId: string; performance: any }) => {
      console.log('Agent performance update:', data);
      handleAgentUpdate(data.agentId, { performance: data.performance });
    });

    return () => {
      socket.off('agentUpdate', handleMessage);
      socket.off('agentEvent', handleMessage);
      socket.off('agentTaskUpdate', handleMessage);
      socket.off('agentInsight', handleMessage);
      socket.off('agentStatusChange', handleMessage);
      socket.off('agentError');
      socket.off('agentHealthUpdate');
      socket.off('agentPerformanceUpdate');
    };
  }, [socket, handleAgentUpdate, handleAgentEvent, handleAgentTaskUpdate, handleAgentInsight]);

  // Auto-subscribe to agents when they change
  useEffect(() => {
    if (isConnected && agents.length > 0) {
      // Subscribe to new agents
      agents.forEach(agent => {
        if (!subscribedAgents.current.has(agent.id)) {
          subscribeToAgent(agent.id);
        }
      });

      // Unsubscribe from agents that no longer exist
      subscribedAgents.current.forEach(agentId => {
        if (!agents.find(agent => agent.id === agentId)) {
          unsubscribeFromAgent(agentId);
        }
      });
    }
  }, [agents, isConnected, subscribeToAgent, unsubscribeFromAgent]);

  // Connect when user is authenticated
  useEffect(() => {
    if (user && !isConnected) {
      connect();
    } else if (!user && isConnected) {
      disconnect();
    }
  }, [user, isConnected, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all agents
      subscribedAgents.current.forEach(agentId => {
        if (socket) {
          socket.emit('leaveAgent', agentId);
        }
      });
      subscribedAgents.current.clear();
    };
  }, [socket]);

  return {
    isConnected,
    subscribeToAgent,
    unsubscribeFromAgent,
    subscribeToAllAgents,
    sendAgentCommand,
    // Expose connection methods for manual control
    connect,
    disconnect
  };
} 