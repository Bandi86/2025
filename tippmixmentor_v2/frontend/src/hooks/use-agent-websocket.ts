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

  const { isConnected, sendMessage } = useWebSocket();
  const subscribedAgents = useRef<Set<string>>(new Set());
  
  // Use refs to store stable references to avoid dependency changes
  const handleAgentUpdateRef = useRef(handleAgentUpdate);
  const handleAgentEventRef = useRef(handleAgentEvent);
  const handleAgentTaskUpdateRef = useRef(handleAgentTaskUpdate);
  const handleAgentInsightRef = useRef(handleAgentInsight);

  // Update refs when handlers change
  useEffect(() => {
    handleAgentUpdateRef.current = handleAgentUpdate;
    handleAgentEventRef.current = handleAgentEvent;
    handleAgentTaskUpdateRef.current = handleAgentTaskUpdate;
    handleAgentInsightRef.current = handleAgentInsight;
  }, [handleAgentUpdate, handleAgentEvent, handleAgentTaskUpdate, handleAgentInsight]);

  // Subscribe to agent updates
  const subscribeToAgent = useCallback((agentId: string) => {
    if (!isConnected) return;

    if (!subscribedAgents.current.has(agentId)) {
      sendMessage('joinAgent', agentId);
      subscribedAgents.current.add(agentId);
      console.log(`Subscribed to agent: ${agentId}`);
    }
  }, [isConnected, sendMessage]);

  // Unsubscribe from agent updates
  const unsubscribeFromAgent = useCallback((agentId: string) => {
    if (!isConnected) return;

    if (subscribedAgents.current.has(agentId)) {
      sendMessage('leaveAgent', agentId);
      subscribedAgents.current.delete(agentId);
      console.log(`Unsubscribed from agent: ${agentId}`);
    }
  }, [isConnected, sendMessage]);

  // Subscribe to all agents
  const subscribeToAllAgents = useCallback(() => {
    agents.forEach(agent => {
      subscribeToAgent(agent.id);
    });
  }, [agents, subscribeToAgent]);

  // Send agent command
  const sendAgentCommand = useCallback((agentId: string, command: string, payload?: any) => {
    if (!isConnected) {
      console.warn('WebSocket not connected, cannot send agent command');
      return;
    }

    sendMessage('agentCommand', {
      agentId,
      command,
      payload,
      timestamp: new Date().toISOString()
    });
  }, [isConnected, sendMessage]);

  // Handle incoming WebSocket messages - use refs to avoid dependency changes
  useEffect(() => {
    const handleMessage = (message: AgentWebSocketMessage) => {
      console.log('Agent WebSocket message received:', message);

      switch (message.type) {
        case 'agent_update':
          handleAgentUpdateRef.current(message.agentId, message.data);
          break;
        
        case 'agent_event':
          handleAgentEventRef.current(message.agentId, message.data);
          break;
        
        case 'agent_task_update':
          handleAgentTaskUpdateRef.current(message.agentId, message.data);
          break;
        
        case 'agent_insight':
          handleAgentInsightRef.current(message.agentId, message.data);
          break;
        
        case 'agent_status_change':
          handleAgentUpdateRef.current(message.agentId, { status: message.data.status });
          break;
        
        default:
          console.warn('Unknown agent WebSocket message type:', message.type);
      }
    };

    // This will be handled by the useWebSocket hook's message handler
    // We just need to make sure our message handler is available
  }, []); // Empty dependency array since we use refs

  // Auto-subscribe to agents when they change - use a more stable approach
  useEffect(() => {
    if (isConnected && agents.length > 0) {
      const currentAgentIds = new Set(agents.map(agent => agent.id));
      
      // Subscribe to new agents
      agents.forEach(agent => {
        if (!subscribedAgents.current.has(agent.id)) {
          subscribeToAgent(agent.id);
        }
      });

      // Unsubscribe from agents that no longer exist
      subscribedAgents.current.forEach(agentId => {
        if (!currentAgentIds.has(agentId)) {
          unsubscribeFromAgent(agentId);
        }
      });
    }
  }, [agents, isConnected, subscribeToAgent, unsubscribeFromAgent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all agents
      subscribedAgents.current.forEach(agentId => {
        if (isConnected) {
          sendMessage('leaveAgent', agentId);
        }
      });
      subscribedAgents.current.clear();
    };
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    subscribeToAgent,
    unsubscribeFromAgent,
    subscribeToAllAgents,
    sendAgentCommand,
  };
} 