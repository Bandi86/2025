# Agent OS - TippMixMentor

## Overview

Agent OS is an intelligent agent operating system designed specifically for the TippMixMentor football prediction platform. It provides automated AI agents that can perform complex tasks, generate insights, and coordinate workflows to enhance the prediction system's capabilities.

## 🚀 Features

### 🤖 **Intelligent Agents**
- **Prediction Agents**: Specialized agents for football match predictions
- **Analysis Agents**: Agents for team and performance analysis
- **Insight Agents**: AI-powered insight generation
- **Workflow Agents**: Automated workflow coordination

### 📊 **Task Management**
- **Async Task Processing**: Non-blocking task execution
- **Task Queuing**: Intelligent task prioritization
- **Status Tracking**: Real-time task status monitoring
- **Error Handling**: Robust error recovery mechanisms

### 🧠 **Memory & Learning**
- **Persistent Memory**: Long-term agent memory storage
- **Context Awareness**: Contextual decision making
- **Learning Capabilities**: Continuous improvement through experience
- **Knowledge Sharing**: Inter-agent knowledge transfer

### 🔄 **Workflow Automation**
- **Multi-step Workflows**: Complex workflow orchestration
- **Dependency Management**: Task dependency resolution
- **Template System**: Pre-built workflow templates
- **Scheduling**: Automated workflow execution

### 📈 **Monitoring & Analytics**
- **Real-time Metrics**: Comprehensive performance monitoring
- **Health Checks**: Agent and system health monitoring
- **Performance Analytics**: Detailed performance insights
- **Alerting**: Proactive issue detection

## 🏗️ Architecture

### Core Components

```
agent-os/
├── main.py                 # FastAPI application entry point
├── core/                   # Core system components
│   ├── config.py          # Configuration management
│   ├── database.py        # Database operations
│   ├── logging.py         # Structured logging
│   └── monitoring.py      # Metrics and monitoring
├── agents/                # Agent implementations
│   ├── base_agent.py      # Base agent class
│   └── prediction_agent.py # Prediction agent
├── routers/               # API endpoints
│   ├── agents.py          # Agent management
│   ├── tasks.py           # Task management
│   ├── insights.py        # Insight generation
│   ├── workflows.py       # Workflow management
│   └── health.py          # Health checks
└── requirements.txt       # Python dependencies
```

### Service Integration

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   ML Service    │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Agent OS      │
                    │   (FastAPI)     │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- Docker (recommended)

### Local Development

1. **Clone and navigate to the agent-os directory:**
```bash
cd agent-os
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the service:**
```bash
python main.py
```

### Docker Deployment

```bash
# Build and start with docker-compose
docker-compose up agent-os

# Or build individually
docker build -t agent-os .
docker run -p 8001:8001 agent-os
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **Health Check**: http://localhost:8001/health

## 🔧 Configuration

### Environment Variables

```env
# Application
DEBUG=false
LOG_LEVEL=INFO
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tippmixmentor
REDIS_URL=redis://localhost:6379

# External Services
BACKEND_URL=http://backend:3001
ML_SERVICE_URL=http://ml-service:8000
FRONTEND_URL=http://frontend:3000

# Agent Configuration
MAX_CONCURRENT_AGENTS=10
AGENT_TIMEOUT=300
AGENT_MEMORY_SIZE=1000

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9091
```

## 🤖 Agent Types

### Prediction Agent
Specialized agent for football match predictions.

**Capabilities:**
- Match outcome predictions
- Batch prediction processing
- Team analysis
- Confidence scoring
- Performance tracking

**Tasks:**
- `predict_match`: Predict single match outcome
- `batch_predict`: Predict multiple matches
- `analyze_team`: Analyze team performance
- `generate_insights`: Generate prediction insights
- `update_predictions`: Update existing predictions

### Analysis Agent
Agent for comprehensive data analysis.

**Capabilities:**
- Statistical analysis
- Trend identification
- Pattern recognition
- Performance evaluation
- Risk assessment

### Insight Agent
AI-powered insight generation.

**Capabilities:**
- Natural language insights
- Trend analysis
- Risk assessment
- Performance analysis
- Market analysis

## 📊 Task Management

### Task Lifecycle

```
Created → Queued → Running → Completed/Failed
   ↓         ↓        ↓           ↓
Pending → Pending → Running → Completed
                              Failed
```

### Task Types

- **prediction**: Match prediction tasks
- **analysis**: Data analysis tasks
- **insight**: Insight generation tasks
- **workflow**: Workflow execution tasks
- **maintenance**: System maintenance tasks

## 🔄 Workflow System

### Workflow Components

1. **Steps**: Individual workflow steps
2. **Dependencies**: Step dependencies
3. **Execution**: Workflow execution engine
4. **Monitoring**: Execution monitoring
5. **Error Handling**: Error recovery

### Pre-built Templates

- **Daily Prediction Workflow**: Automated daily predictions
- **Weekly Analysis Workflow**: Weekly performance analysis
- **Monthly Report Workflow**: Monthly reporting
- **Custom Workflows**: User-defined workflows

## 📈 Monitoring & Metrics

### Available Metrics

- **Agent Metrics**: Agent creation, activity, performance
- **Task Metrics**: Task completion, failure rates, duration
- **Prediction Metrics**: Prediction accuracy, confidence
- **System Metrics**: Memory usage, CPU usage, response times
- **Workflow Metrics**: Workflow execution, success rates

### Health Checks

- **Service Health**: Overall service health
- **Database Health**: Database connectivity
- **Agent Health**: Individual agent health
- **Task Queue Health**: Task queue status

## 🔌 Integration

### Backend Integration
```python
import httpx

# Create an agent
response = await httpx.post("http://agent-os:8001/agents/", json={
    "name": "Prediction Agent 1",
    "agent_type": "prediction",
    "config": {"confidence_threshold": 0.7}
})

# Add a task
response = await httpx.post(f"http://agent-os:8001/agents/{agent_id}/tasks", json={
    "task_type": "predict_match",
    "input_data": {
        "home_team_id": 123,
        "away_team_id": 456,
        "match_date": "2024-01-15T20:00:00Z"
    }
})
```

### Frontend Integration
```typescript
// Get agent status
const response = await fetch('http://localhost:8001/agents/');
const agents = await response.json();

// Monitor tasks
const tasks = await fetch('http://localhost:8001/tasks/');
const taskList = await tasks.json();
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test
pytest tests/test_agents.py
```

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: Service integration testing
- **API Tests**: Endpoint testing
- **Agent Tests**: Agent functionality testing

## 🚀 Deployment

### Production Deployment

1. **Environment Setup:**
```bash
# Set production environment variables
export NODE_ENV=production
export DEBUG=false
```

2. **Database Migration:**
```bash
# Run database migrations
python -m alembic upgrade head
```

3. **Service Deployment:**
```bash
# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-os
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agent-os
  template:
    metadata:
      labels:
        app: agent-os
    spec:
      containers:
      - name: agent-os
        image: agent-os:latest
        ports:
        - containerPort: 8001
```

## 🔒 Security

### Security Features
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input validation
- **Rate Limiting**: API rate limiting
- **CORS Protection**: Cross-origin resource sharing
- **Security Headers**: Security header middleware

### Best Practices
- Use environment variables for secrets
- Enable HTTPS in production
- Regular security updates
- Monitor for security issues
- Implement proper logging

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is part of the TippMixMentor platform and follows the same licensing terms.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation
- Review the API documentation

---

**Agent OS** - The intelligent backbone of TippMixMentor! 🤖⚽ 