# Agent Management System

This directory contains the frontend components for managing AI agents in the TippMixMentor system. The agent management system provides a comprehensive interface for monitoring, controlling, and interacting with intelligent prediction agents.

## Components

### Core Components

#### `AgentCard`
A reusable card component that displays individual agent information including:
- Agent name, description, and type
- Current status and health indicators
- Performance metrics (accuracy, response time, task completion)
- Action buttons for start/stop/configure operations

**Props:**
```typescript
interface AgentCardProps {
  agent: Agent;
  onStart?: (agentId: string) => void;
  onStop?: (agentId: string) => void;
  onConfigure?: (agentId: string) => void;
  onViewDetails?: (agentId: string) => void;
  className?: string;
}
```

#### `AgentList`
A comprehensive list view that displays multiple agents with:
- Grid and list view modes
- Search and filtering capabilities
- Statistics overview
- Bulk operations

**Props:**
```typescript
interface AgentListProps {
  agents: Agent[];
  onStart?: (agentId: string) => void;
  onStop?: (agentId: string) => void;
  onConfigure?: (agentId: string) => void;
  onViewDetails?: (agentId: string) => void;
  onCreateAgent?: () => void;
  isLoading?: boolean;
}
```

#### `AgentDetails`
A detailed view component showing comprehensive agent information:
- Overview tab with agent information and performance metrics
- Tasks tab showing recent and active tasks
- Events tab displaying agent events and logs
- Insights tab showing AI-generated insights
- Performance tab with trends and analytics

**Props:**
```typescript
interface AgentDetailsProps {
  agent: Agent;
  onBack: () => void;
  onStart?: (agentId: string) => void;
  onStop?: (agentId: string) => void;
  onConfigure?: (agentId: string) => void;
}
```

#### `AgentMonitor`
A real-time monitoring dashboard showing:
- System overview with key metrics
- Active tasks across all agents
- Recent events and alerts
- Performance trends and health indicators

**Props:**
```typescript
interface AgentMonitorProps {
  className?: string;
}
```

### Supporting Components

#### `AgentInsights`
Displays AI-generated insights and recommendations for predictions:
- Market trend analysis
- Risk assessments
- Opportunity detection
- Performance optimization suggestions

## State Management

### Agent Store (`useAgentStore`)
A Zustand store that manages agent state and provides actions:

**State:**
- `agents`: Array of all agents
- `selectedAgent`: Currently selected agent
- `agentTasks`: Tasks organized by agent ID
- `agentEvents`: Events organized by agent ID
- `agentInsights`: Insights organized by agent ID
- `isLoading`: Loading state
- `error`: Error state
- `lastUpdated`: Last update timestamp

**Actions:**
- Agent CRUD operations
- Agent control (start/stop)
- Task management
- Event handling
- WebSocket message handling

### WebSocket Integration (`useAgentWebSocket`)
A specialized hook for real-time agent communication:

**Features:**
- Automatic connection management
- Agent subscription/unsubscription
- Real-time event handling
- Command sending capabilities

## API Integration

### Agent API Service (`agentAPI`)
A comprehensive API service for backend communication:

**Endpoints:**
- Agent management (CRUD operations)
- Agent control (start/stop/status)
- Task management
- Event retrieval
- Insight management
- Performance monitoring
- Workflow management
- Integration management

## Usage Examples

### Basic Agent List
```tsx
import { AgentList } from '@/components/agents';

function MyComponent() {
  const { agents, startAgent, stopAgent } = useAgentStore();

  return (
    <AgentList
      agents={agents}
      onStart={startAgent}
      onStop={stopAgent}
      onViewDetails={(agent) => console.log('View details:', agent)}
    />
  );
}
```

### Agent Details View
```tsx
import { AgentDetails } from '@/components/agents';

function AgentDetailsPage() {
  const { selectedAgent, startAgent, stopAgent } = useAgentStore();

  return (
    <AgentDetails
      agent={selectedAgent}
      onBack={() => navigate('/agents')}
      onStart={startAgent}
      onStop={stopAgent}
    />
  );
}
```

### Real-time Monitoring
```tsx
import { AgentMonitor } from '@/components/agents';

function Dashboard() {
  return (
    <div>
      <h1>System Dashboard</h1>
      <AgentMonitor />
    </div>
  );
}
```

## Agent Types

The system supports various agent types:

- **market_analysis**: Analyzes market trends and betting patterns
- **risk_assessment**: Evaluates risk levels and volatility
- **value_detection**: Identifies undervalued betting opportunities
- **prediction_optimization**: Optimizes prediction models
- **strategy_optimization**: Optimizes betting strategies

## Agent Status

Agents can have the following statuses:
- **active**: Agent is running and processing tasks
- **inactive**: Agent is stopped
- **starting**: Agent is in the process of starting
- **stopping**: Agent is in the process of stopping
- **error**: Agent has encountered an error

## Agent Health

Health indicators:
- **healthy**: Agent is functioning normally
- **warning**: Agent has minor issues
- **critical**: Agent has serious problems

## WebSocket Events

The system handles various WebSocket events:
- `agentUpdate`: Agent status or configuration updates
- `agentEvent`: New agent events
- `agentTaskUpdate`: Task status changes
- `agentInsight`: New AI insights
- `agentError`: Agent error notifications
- `agentHealthUpdate`: Health status changes
- `agentPerformanceUpdate`: Performance metric updates

## Styling

All components use Tailwind CSS for styling and follow the design system established by shadcn/ui components. The components are responsive and work well on both desktop and mobile devices.

## Error Handling

The system includes comprehensive error handling:
- API request failures
- WebSocket connection issues
- Agent operation failures
- Network connectivity problems

## Performance Considerations

- Components use React.memo for optimization
- Zustand store includes selective subscriptions
- WebSocket connections are managed efficiently
- Loading states provide good UX during operations

## Future Enhancements

Potential improvements:
- Agent creation wizard
- Advanced filtering and search
- Bulk operations
- Agent templates
- Performance analytics
- Integration with external services
- Mobile-specific optimizations 