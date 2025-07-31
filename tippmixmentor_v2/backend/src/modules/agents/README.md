# Agents Module

The Agents module provides comprehensive agent management capabilities with integration to the Agent OS system. It enables creation, monitoring, and control of intelligent agents for football prediction and analytics.

## Features

### Core Agent Management
- **Agent Creation**: Create different types of agents (PREDICTION, ANALYTICS, MONITORING, etc.)
- **Agent Lifecycle**: Start, stop, pause, and resume agents
- **Status Monitoring**: Real-time agent status and health monitoring
- **Configuration Management**: Dynamic agent configuration updates

### Task Management
- **Task Creation**: Create and assign tasks to agents
- **Task Monitoring**: Track task status (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
- **Priority Management**: Task prioritization (LOW, NORMAL, HIGH, CRITICAL)
- **Result Retrieval**: Get task results and outputs

### Event System
- **Event Logging**: Comprehensive event logging with severity levels
- **Event Filtering**: Filter events by type, severity, and time range
- **Event Statistics**: Get event statistics and analytics
- **Real-time Events**: WebSocket-based real-time event broadcasting

### Insights Management
- **Insight Generation**: Store and manage agent-generated insights
- **Confidence Scoring**: Track insight confidence levels
- **Metadata Support**: Rich metadata for insights
- **Recent Insights**: Quick access to recent insights

### Workflow Management
- **Workflow Creation**: Define multi-step agent workflows
- **Workflow Control**: Start, pause, and manage workflow execution
- **Step Configuration**: Flexible workflow step configuration
- **Status Tracking**: Monitor workflow execution status

### Performance Monitoring
- **Performance Metrics**: Track agent performance over time
- **Success Rates**: Monitor task success and failure rates
- **Response Times**: Track average response times
- **Uptime Monitoring**: Monitor agent availability

### Integration System
- **External Integrations**: Manage integrations with external services
- **Configuration Management**: Flexible integration configuration
- **Status Control**: Enable/disable integrations
- **Type-based Routing**: Route requests based on integration type

## Architecture

### Database Schema

The module uses the following database tables:

- **agents**: Core agent information and configuration
- **agent_tasks**: Task management and tracking
- **agent_events**: Event logging and monitoring
- **agent_insights**: Insight storage and management
- **agent_workflows**: Workflow definitions and execution
- **agent_performance**: Performance metrics and analytics
- **agent_integrations**: Integration configurations

### Service Architecture

```
AgentsModule
├── AgentsService (Core agent management)
├── AgentTasksService (Task management)
├── AgentEventsService (Event logging)
├── AgentInsightsService (Insight management)
├── AgentWorkflowsService (Workflow management)
├── AgentPerformanceService (Performance monitoring)
└── AgentIntegrationService (Integration management)
```

### Agent OS Integration

The module integrates with the Agent OS system through:

- **HTTP API Communication**: RESTful API calls to Agent OS
- **Redis Mapping**: Store agent ID mappings between systems
- **Real-time Updates**: WebSocket-based real-time communication
- **Health Monitoring**: Continuous health checks and status updates

## API Endpoints

### Agent Management

```
POST   /agents                    # Create new agent
GET    /agents                    # List all agents
GET    /agents/:id                # Get agent details
PATCH  /agents/:id                # Update agent
DELETE /agents/:id                # Delete agent
POST   /agents/:id/start          # Start agent
POST   /agents/:id/stop           # Stop agent
GET    /agents/:id/status         # Get agent status
GET    /agents/:id/health         # Get agent health
```

### Task Management

```
POST   /agents/:id/tasks                    # Create task
GET    /agents/:id/tasks                    # List tasks
GET    /agents/:id/tasks/:taskId            # Get task details
GET    /agents/:id/tasks/:taskId/result     # Get task result
POST   /agents/:id/tasks/:taskId/cancel     # Cancel task
GET    /agents/:id/tasks/status/:status     # Get tasks by status
```

### Event Management

```
POST   /agents/:id/events         # Create event
GET    /agents/:id/events         # List events
GET    /agents/:id/events/recent  # Get recent events
GET    /agents/:id/events/stats   # Get event statistics
```

### Insight Management

```
POST   /agents/:id/insights       # Create insight
GET    /agents/:id/insights       # List insights
GET    /agents/:id/insights/recent # Get recent insights
```

### Workflow Management

```
POST   /agents/:id/workflows                    # Create workflow
GET    /agents/:id/workflows                    # List workflows
POST   /agents/:id/workflows/:workflowId/toggle # Toggle workflow
```

### Performance Monitoring

```
GET    /agents/:id/performance    # Get performance metrics
```

### Integration Management

```
POST   /agents/integrations       # Create integration
GET    /agents/integrations       # List integrations
GET    /agents/integrations/:id   # Get integration details
POST   /agents/integrations/:id/toggle # Toggle integration
```

## WebSocket Events

### Client to Server

```
joinAgent: Join agent room for real-time updates
leaveAgent: Leave agent room
agentCommand: Send command to agent (start, stop, status, health)
```

### Server to Client

```
agentEvent: Agent event updates
agentStatusUpdate: Agent status changes
agentTaskUpdate: Task status updates
agentInsight: New insights generated
agentPerformanceUpdate: Performance metric updates
agentError: Agent error notifications
```

## Usage Examples

### Creating a Prediction Agent

```typescript
const agent = await agentsService.create({
  name: 'Advanced Prediction Agent v2.1',
  agentType: AgentType.PREDICTION,
  config: {
    modelVersion: '2.1.0',
    confidenceThreshold: 0.8,
    updateInterval: 300,
    features: ['team_form', 'head_to_head', 'injuries', 'weather']
  },
  metadata: {
    description: 'Advanced ML-based prediction agent',
    tags: ['ml', 'prediction', 'football'],
    author: 'AI Team'
  }
});
```

### Creating a Task

```typescript
const task = await agentTasksService.create(agentId, {
  taskType: 'predict_match',
  priority: TaskPriority.HIGH,
  inputData: {
    matchId: 'clx1234567890abcdef',
    league: 'Premier League',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool'
  }
});
```

### Monitoring Agent Events

```typescript
// WebSocket connection
socket.emit('joinAgent', agentId);

socket.on('agentEvent', (data) => {
  console.log('Agent event:', data.event);
});

socket.on('agentStatusUpdate', (data) => {
  console.log('Agent status:', data.status);
});
```

## Configuration

### Environment Variables

```env
AGENT_OS_URL=http://localhost:8000
AGENTS_SERVICE_URL=http://localhost:3001
```

### Agent Types

- **PREDICTION**: Football match prediction agents
- **ANALYTICS**: Data analysis and insights agents
- **MONITORING**: System monitoring and alerting agents
- **INSIGHT**: AI-powered insight generation agents
- **WORKFLOW**: Workflow automation agents
- **CUSTOM**: Custom agent implementations

### Task Priorities

- **LOW**: Background tasks with no urgency
- **NORMAL**: Standard priority tasks
- **HIGH**: Important tasks requiring attention
- **CRITICAL**: Urgent tasks requiring immediate processing

### Event Severity Levels

- **DEBUG**: Debug information
- **INFO**: General information
- **WARNING**: Warning messages
- **ERROR**: Error conditions
- **CRITICAL**: Critical system issues

## Testing

Run the test suite:

```bash
npm run test agents.service.spec.ts
```

## Dependencies

- **Prisma**: Database ORM
- **Redis**: Caching and session management
- **Axios**: HTTP client for Agent OS communication
- **Socket.io**: WebSocket communication
- **JWT**: Authentication and authorization

## Contributing

1. Follow the established code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure proper error handling and logging
5. Follow the microservices architecture patterns 