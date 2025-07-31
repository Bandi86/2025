import { Agent } from '@/components/agents/agent-card';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface CreateAgentRequest {
  name: string;
  description?: string;
  type: string;
  config?: Record<string, any>;
}

interface UpdateAgentRequest {
  name?: string;
  description?: string;
  config?: Record<string, any>;
}

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

class AgentAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Agent Management
  async getAgents(): Promise<Agent[]> {
    return this.request<Agent[]>('/agents');
  }

  async getAgent(id: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}`);
  }

  async createAgent(data: CreateAgentRequest): Promise<Agent> {
    return this.request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgent(id: string, data: UpdateAgentRequest): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: string): Promise<void> {
    return this.request<void>(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Agent Control
  async startAgent(id: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}/start`, {
      method: 'POST',
    });
  }

  async stopAgent(id: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}/stop`, {
      method: 'POST',
    });
  }

  async getAgentStatus(id: string): Promise<any> {
    return this.request<any>(`/agents/${id}/status`);
  }

  async getAgentHealth(id: string): Promise<any> {
    return this.request<any>(`/agents/${id}/health`);
  }

  // Task Management
  async getAgentTasks(agentId: string, limit?: number, offset?: number): Promise<AgentTask[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    return this.request<AgentTask[]>(`/agents/${agentId}/tasks?${params.toString()}`);
  }

  async getAgentTask(agentId: string, taskId: string): Promise<AgentTask> {
    return this.request<AgentTask>(`/agents/${agentId}/tasks/${taskId}`);
  }

  async createAgentTask(agentId: string, taskData: {
    type: string;
    priority?: 'low' | 'medium' | 'high';
    payload?: any;
  }): Promise<AgentTask> {
    return this.request<AgentTask>(`/agents/${agentId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async cancelAgentTask(agentId: string, taskId: string): Promise<AgentTask> {
    return this.request<AgentTask>(`/agents/${agentId}/tasks/${taskId}/cancel`, {
      method: 'POST',
    });
  }

  // Event Management
  async getAgentEvents(agentId: string, limit?: number, offset?: number): Promise<AgentEvent[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    return this.request<AgentEvent[]>(`/agents/${agentId}/events?${params.toString()}`);
  }

  async getRecentAgentEvents(agentId: string, hours?: number): Promise<AgentEvent[]> {
    const params = new URLSearchParams();
    if (hours) params.append('hours', hours.toString());
    
    return this.request<AgentEvent[]>(`/agents/${agentId}/events/recent?${params.toString()}`);
  }

  async getAgentEventStats(agentId: string, hours?: number): Promise<any> {
    const params = new URLSearchParams();
    if (hours) params.append('hours', hours.toString());
    
    return this.request<any>(`/agents/${agentId}/events/stats?${params.toString()}`);
  }

  // Insight Management
  async getAgentInsights(agentId: string, limit?: number, offset?: number): Promise<AgentInsight[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    return this.request<AgentInsight[]>(`/agents/${agentId}/insights?${params.toString()}`);
  }

  async getRecentAgentInsights(agentId: string, hours?: number): Promise<AgentInsight[]> {
    const params = new URLSearchParams();
    if (hours) params.append('hours', hours.toString());
    
    return this.request<AgentInsight[]>(`/agents/${agentId}/insights/recent?${params.toString()}`);
  }

  // Performance
  async getAgentPerformance(agentId: string): Promise<any> {
    return this.request<any>(`/agents/${agentId}/performance`);
  }

  // Workflow Management
  async getAgentWorkflows(agentId: string): Promise<any[]> {
    return this.request<any[]>(`/agents/${agentId}/workflows`);
  }

  async createAgentWorkflow(agentId: string, workflowData: {
    name: string;
    description?: string;
    steps: Record<string, any>;
  }): Promise<any> {
    return this.request<any>(`/agents/${agentId}/workflows`, {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  async toggleAgentWorkflow(agentId: string, workflowId: string): Promise<any> {
    return this.request<any>(`/agents/${agentId}/workflows/${workflowId}/toggle`, {
      method: 'POST',
    });
  }

  // Integration Management
  async getIntegrations(): Promise<any[]> {
    return this.request<any[]>('/agents/integrations');
  }

  async getIntegration(id: string): Promise<any> {
    return this.request<any>(`/agents/integrations/${id}`);
  }

  async createIntegration(integrationData: {
    name: string;
    type: string;
    config: Record<string, any>;
  }): Promise<any> {
    return this.request<any>('/agents/integrations', {
      method: 'POST',
      body: JSON.stringify(integrationData),
    });
  }

  async toggleIntegration(id: string): Promise<any> {
    return this.request<any>(`/agents/integrations/${id}/toggle`, {
      method: 'POST',
    });
  }
}

export const agentAPI = new AgentAPI();
export type {
  CreateAgentRequest,
  UpdateAgentRequest,
  AgentTask,
  AgentEvent,
  AgentInsight,
}; 