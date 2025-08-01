import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Agent } from '@/components/agents/agent-card';

interface AgentTask {
  id: string;
  agentId: string;
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
  agentId: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface AgentInsight {
  id: string;
  agentId: string;
  type: string;
  content: string;
  confidence: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface AgentState {
  // State
  agents: Agent[];
  selectedAgent: Agent | null;
  agentTasks: Record<string, AgentTask[]>;
  agentEvents: Record<string, AgentEvent[]>;
  agentInsights: Record<string, AgentInsight[]>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  removeAgent: (agentId: string) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  
  // Task management
  setAgentTasks: (agentId: string, tasks: AgentTask[]) => void;
  addAgentTask: (agentId: string, task: AgentTask) => void;
  updateAgentTask: (agentId: string, taskId: string, updates: Partial<AgentTask>) => void;
  
  // Event management
  setAgentEvents: (agentId: string, events: AgentEvent[]) => void;
  addAgentEvent: (agentId: string, event: AgentEvent) => void;
  
  // Insight management
  setAgentInsights: (agentId: string, insights: AgentInsight[]) => void;
  addAgentInsight: (agentId: string, insight: AgentInsight) => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: Date) => void;
  
  // Agent control actions
  startAgent: (agentId: string) => Promise<void>;
  stopAgent: (agentId: string) => Promise<void>;
  createAgent: (agentData: Partial<Agent>) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  
  // WebSocket actions
  handleAgentUpdate: (agentId: string, updates: Partial<Agent>) => void;
  handleAgentEvent: (agentId: string, event: AgentEvent) => void;
  handleAgentTaskUpdate: (agentId: string, task: AgentTask) => void;
  handleAgentInsight: (agentId: string, insight: AgentInsight) => void;
}

export const useAgentStore = create<AgentState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    agents: [],
    selectedAgent: null,
    agentTasks: {},
    agentEvents: {},
    agentInsights: {},
    isLoading: false,
    error: null,
    lastUpdated: null,

    // State setters
    setAgents: (agents) => set({ agents, lastUpdated: new Date() }),
    
    addAgent: (agent) => set((state) => ({
      agents: [...state.agents, agent],
      lastUpdated: new Date()
    })),
    
    updateAgent: (agentId, updates) => set((state) => ({
      agents: state.agents.map(agent => 
        agent.id === agentId ? { ...agent, ...updates } : agent
      ),
      selectedAgent: state.selectedAgent?.id === agentId 
        ? { ...state.selectedAgent, ...updates }
        : state.selectedAgent,
      lastUpdated: new Date()
    })),
    
    removeAgent: (agentId) => set((state) => ({
      agents: state.agents.filter(agent => agent.id !== agentId),
      selectedAgent: state.selectedAgent?.id === agentId ? null : state.selectedAgent,
      agentTasks: Object.fromEntries(
        Object.entries(state.agentTasks).filter(([id]) => id !== agentId)
      ),
      agentEvents: Object.fromEntries(
        Object.entries(state.agentEvents).filter(([id]) => id !== agentId)
      ),
      agentInsights: Object.fromEntries(
        Object.entries(state.agentInsights).filter(([id]) => id !== agentId)
      ),
      lastUpdated: new Date()
    })),
    
    setSelectedAgent: (agent) => set({ selectedAgent: agent }),

    // Task management
    setAgentTasks: (agentId, tasks) => set((state) => ({
      agentTasks: { ...state.agentTasks, [agentId]: tasks }
    })),
    
    addAgentTask: (agentId, task) => set((state) => ({
      agentTasks: {
        ...state.agentTasks,
        [agentId]: [...(state.agentTasks[agentId] || []), task]
      }
    })),
    
    updateAgentTask: (agentId, taskId, updates) => set((state) => ({
      agentTasks: {
        ...state.agentTasks,
        [agentId]: (state.agentTasks[agentId] || []).map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      }
    })),

    // Event management
    setAgentEvents: (agentId, events) => set((state) => ({
      agentEvents: { ...state.agentEvents, [agentId]: events }
    })),
    
    addAgentEvent: (agentId, event) => set((state) => ({
      agentEvents: {
        ...state.agentEvents,
        [agentId]: [...(state.agentEvents[agentId] || []), event]
      }
    })),

    // Insight management
    setAgentInsights: (agentId, insights) => set((state) => ({
      agentInsights: { ...state.agentInsights, [agentId]: insights }
    })),
    
    addAgentInsight: (agentId, insight) => set((state) => ({
      agentInsights: {
        ...state.agentInsights,
        [agentId]: [...(state.agentInsights[agentId] || []), insight]
      }
    })),

    // Loading states
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setLastUpdated: (date) => set({ lastUpdated: date }),

    // Agent control actions
    startAgent: async (agentId) => {
      set({ isLoading: true, error: null });
      try {
        // Update local state immediately for optimistic UI
        get().updateAgent(agentId, { status: 'starting' });
        
        // In real app, this would be an API call
        // const response = await fetch(`/api/agents/${agentId}/start`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' }
        // });
        // if (!response.ok) throw new Error('Failed to start agent');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        get().updateAgent(agentId, { status: 'active' });
        get().addAgentEvent(agentId, {
          id: Date.now().toString(),
          agentId,
          type: 'agent_started',
          severity: 'info',
          message: 'Agent started successfully',
          timestamp: new Date()
        });
      } catch (error) {
        get().setError(error instanceof Error ? error.message : 'Failed to start agent');
        get().updateAgent(agentId, { status: 'inactive' });
      } finally {
        set({ isLoading: false });
      }
    },

    stopAgent: async (agentId) => {
      set({ isLoading: true, error: null });
      try {
        get().updateAgent(agentId, { status: 'stopping' });
        
        // In real app, this would be an API call
        // const response = await fetch(`/api/agents/${agentId}/stop`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' }
        // });
        // if (!response.ok) throw new Error('Failed to stop agent');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        get().updateAgent(agentId, { status: 'inactive' });
        get().addAgentEvent(agentId, {
          id: Date.now().toString(),
          agentId,
          type: 'agent_stopped',
          severity: 'info',
          message: 'Agent stopped successfully',
          timestamp: new Date()
        });
      } catch (error) {
        get().setError(error instanceof Error ? error.message : 'Failed to stop agent');
        get().updateAgent(agentId, { status: 'active' });
      } finally {
        set({ isLoading: false });
      }
    },

    createAgent: async (agentData) => {
      set({ isLoading: true, error: null });
      try {
        // In real app, this would be an API call
        // const response = await fetch('/api/agents', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(agentData)
        // });
        // if (!response.ok) throw new Error('Failed to create agent');
        // const newAgent = await response.json();
        
        const newAgent: Agent = {
          id: Date.now().toString(),
          name: agentData.name || 'New Agent',
          description: agentData.description || 'No description provided',
          type: agentData.type || 'prediction',
          status: 'inactive',
          health: 'healthy',
          performance: {
            accuracy: 0,
            responseTime: 0,
            tasksCompleted: 0,
            tasksFailed: 0
          },
          lastActive: new Date(),
          createdAt: new Date(),
          config: agentData.config
        };
        
        get().addAgent(newAgent);
      } catch (error) {
        get().setError(error instanceof Error ? error.message : 'Failed to create agent');
      } finally {
        set({ isLoading: false });
      }
    },

    deleteAgent: async (agentId) => {
      set({ isLoading: true, error: null });
      try {
        // In real app, this would be an API call
        // const response = await fetch(`/api/agents/${agentId}`, {
        //   method: 'DELETE'
        // });
        // if (!response.ok) throw new Error('Failed to delete agent');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        get().removeAgent(agentId);
      } catch (error) {
        get().setError(error instanceof Error ? error.message : 'Failed to delete agent');
      } finally {
        set({ isLoading: false });
      }
    },

    // WebSocket handlers
    handleAgentUpdate: (agentId, updates) => {
      get().updateAgent(agentId, updates);
    },

    handleAgentEvent: (agentId, event) => {
      get().addAgentEvent(agentId, event);
    },

    handleAgentTaskUpdate: (agentId, task) => {
      const state = get();
      const existingTask = state.agentTasks[agentId]?.find(t => t.id === task.id);
      
      if (existingTask) {
        state.updateAgentTask(agentId, task.id, task);
      } else {
        state.addAgentTask(agentId, task);
      }
    },

    handleAgentInsight: (agentId, insight) => {
      get().addAgentInsight(agentId, insight);
    }
  }))
); 