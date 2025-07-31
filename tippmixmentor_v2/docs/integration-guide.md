# TippMixMentor v2 - Agent System & Prediction Model Integration Guide

## Overview

This document provides a comprehensive guide to the integrated agent system and prediction model architecture in TippMixMentor v2. The system combines intelligent agents with machine learning models to provide enhanced football predictions and insights.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Agent OS      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   ML Service    │
                       │   (PostgreSQL)  │    │   (FastAPI)     │
                       └─────────────────┘    └─────────────────┘
```

## Components

### 1. Agent OS (Port 8001)
- **Purpose**: Intelligent agent management and orchestration
- **Technology**: FastAPI, Python
- **Key Features**:
  - Agent lifecycle management
  - Task execution and workflow orchestration
  - Memory and learning capabilities
  - Integration with ML services

### 2. ML Service (Port 8000)
- **Purpose**: Machine learning model serving
- **Technology**: FastAPI, Python, scikit-learn
- **Key Features**:
  - Prediction model serving
  - AI insights generation
  - Model training and management
  - Real-time predictions

### 3. Backend API (Port 3001)
- **Purpose**: Main API gateway and business logic
- **Technology**: NestJS, TypeScript
- **Key Features**:
  - User management and authentication
  - Match data management
  - Integration orchestration
  - Enhanced prediction endpoints

### 4. Frontend (Port 3000)
- **Purpose**: User interface
- **Technology**: Next.js, React, TypeScript
- **Key Features**:
  - Real-time predictions display
  - Agent monitoring dashboard
  - Enhanced insights visualization

## Enhanced Prediction Endpoints

### Backend API Endpoints

#### 1. Agent-Based Predictions
```http
GET /predictions/match/{matchId}/agent-prediction?agentId={agentId}
```

**Response**:
```json
{
  "success": true,
  "enhanced_prediction": {
    "prediction": {
      "match_result": {"home_win": 0.4, "draw": 0.3, "away_win": 0.3},
      "over_under": {"over_2_5": 0.6, "under_2_5": 0.4},
      "both_teams_score": {"yes": 0.7, "no": 0.3}
    },
    "team_analysis": {
      "home_team": {...},
      "away_team": {...},
      "comparison": {...}
    },
    "ai_insights": {...},
    "confidence_score": 0.75,
    "recommendations": [...],
    "risk_assessment": {...}
  }
}
```

#### 2. Enhanced Insights
```http
GET /predictions/match/{matchId}/enhanced-insights?insightType=comprehensive
```

#### 3. Prediction Workflows
```http
GET /predictions/match/{matchId}/workflow?workflowType=standard
```

#### 4. Team Analysis
```http
GET /predictions/team/{teamId}/analysis?analysisType=comprehensive
```

#### 5. Prediction Trends
```http
GET /predictions/trends?timePeriod=7d&trendType=general
```

#### 6. Agent Management
```http
GET /predictions/agents/{agentId}/status
GET /predictions/agents/{agentId}/health
```

## Agent System Integration

### Agent Types

#### 1. Prediction Agent
- **Purpose**: Specialized in football match predictions
- **Capabilities**:
  - Enhanced predictions with team analysis
  - AI insights generation
  - Workflow execution
  - Risk assessment
  - Confidence calculation

#### 2. Analysis Agent
- **Purpose**: Team and performance analysis
- **Capabilities**:
  - Team performance analysis
  - Historical data analysis
  - Trend identification
  - Statistical insights

### Agent Tasks

#### 1. Enhanced Prediction Task
```json
{
  "task_type": "enhanced_prediction",
  "input_data": {
    "home_team_id": 1,
    "away_team_id": 2,
    "match_date": "2024-01-15T20:00:00Z",
    "home_team_name": "Team A",
    "away_team_name": "Team B"
  }
}
```

#### 2. Workflow Prediction Task
```json
{
  "task_type": "workflow_prediction",
  "input_data": {
    "workflow_type": "comprehensive",
    "match_data": {
      "home_team_id": 1,
      "away_team_id": 2,
      "match_date": "2024-01-15T20:00:00Z"
    }
  }
}
```

#### 3. Team Analysis Task
```json
{
  "task_type": "analyze_team",
  "input_data": {
    "team_id": 1,
    "analysis_type": "comprehensive"
  }
}
```

## Workflow System

### Workflow Types

#### 1. Standard Prediction Workflow
- Data validation
- Team analysis
- Prediction generation
- Insight generation

#### 2. Comprehensive Prediction Workflow
- Data validation
- Team analysis
- Historical analysis
- Prediction generation
- AI insights
- Trend analysis
- Confidence calculation
- Risk assessment
- Recommendation generation

#### 3. Real-time Prediction Workflow
- Quick validation
- Fast prediction
- Basic insight

### Workflow Execution

```http
POST /workflows/execute
```

**Request**:
```json
{
  "workflow_type": "comprehensive_prediction",
  "input_data": {
    "home_team_id": 1,
    "away_team_id": 2,
    "match_date": "2024-01-15T20:00:00Z"
  },
  "agent_id": "optional-agent-id"
}
```

**Response**:
```json
{
  "workflow_id": "uuid",
  "workflow_type": "comprehensive_prediction",
  "status": "running",
  "created_at": "2024-01-15T10:00:00Z"
}
```

## ML Service Integration

### Prediction Endpoints

#### 1. Single Match Prediction
```http
POST /predictions/predict
```

#### 2. Batch Predictions
```http
POST /predictions/batch-predict
```

#### 3. AI Insights
```http
POST /predictions/ai-insights
```

### Model Management

#### 1. Model Status
```http
GET /models/status
```

#### 2. Model Information
```http
GET /models/info
```

#### 3. Model Training
```http
POST /predictions/train
```

## Configuration

### Environment Variables

#### Agent OS Configuration
```bash
AGENT_OS_URL=http://localhost:8001
AGENT_OS_DEBUG=true
AGENT_OS_LOG_LEVEL=INFO
AGENT_OS_ENABLE_METRICS=true
AGENT_OS_MAX_PREDICTIONS_PER_REQUEST=50
AGENT_OS_PREDICTION_CONFIDENCE_THRESHOLD=0.7
AGENT_OS_MAX_RETRIES=3
AGENT_OS_RETRY_DELAY=1.0
```

#### ML Service Configuration
```bash
ML_SERVICE_URL=http://localhost:8000
MODEL_PATH=./prediction_model/models
DATA_PATH=./prediction_model/data
```

## Testing

### Running Integration Tests

#### 1. Basic Integration Test
```bash
cd agent-os
python test_integration.py
```

#### 2. Complete Integration Test
```bash
python test_integration_complete.py
```

### Test Categories

1. **Service Availability**: Check if all services are running
2. **Health Endpoints**: Test health check endpoints
3. **Authentication**: Test user registration and authentication
4. **Agent System**: Test agent creation and management
5. **ML Service**: Test ML model status and predictions
6. **Workflows**: Test workflow execution
7. **Enhanced Features**: Test advanced prediction features
8. **Error Handling**: Test error scenarios
9. **Performance**: Test concurrent requests and load handling
10. **Data Flow**: Test communication between services

## Monitoring and Metrics

### Prometheus Metrics

The system exposes Prometheus metrics for monitoring:

- HTTP request counts and latency
- Agent creation and task execution metrics
- Prediction accuracy metrics
- Workflow execution metrics

### Health Checks

All services provide health check endpoints:

- Backend: `GET /health`
- Agent OS: `GET /health`
- ML Service: `GET /health`

## Error Handling

### Common Error Scenarios

1. **Service Unavailable**: When ML service or Agent OS is down
2. **Invalid Input**: When required data is missing
3. **Timeout**: When requests take too long
4. **Rate Limiting**: When too many requests are made

### Error Response Format
```json
{
  "error": "Service unavailable",
  "message": "ML service is currently unavailable",
  "statusCode": 503,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Performance Optimization

### Caching Strategy

- **Prediction Cache**: 30 minutes for agent-based predictions
- **Insights Cache**: 15 minutes for enhanced insights
- **Team Analysis Cache**: 2 hours for team analysis
- **Trends Cache**: 1 hour for prediction trends

### Concurrency

- **Batch Predictions**: Limited to 5 concurrent requests
- **Workflow Execution**: Background task processing
- **Agent Tasks**: Async execution with retry logic

## Security Considerations

### Authentication

- JWT-based authentication for all API endpoints
- Role-based access control
- API key authentication for service-to-service communication

### Rate Limiting

- Per-endpoint rate limiting
- User-based rate limiting
- Service-based rate limiting

### Data Validation

- Input validation for all endpoints
- SQL injection prevention
- XSS protection

## Deployment

### Docker Compose

The system is containerized using Docker Compose:

```bash
docker-compose up -d
```

### Service Dependencies

1. PostgreSQL (Database)
2. Redis (Caching)
3. Backend API
4. ML Service
5. Agent OS
6. Frontend

### Health Checks

All services include health checks to ensure proper startup order.

## Troubleshooting

### Common Issues

1. **Agent Creation Fails**
   - Check Agent OS service is running
   - Verify database connectivity
   - Check logs for detailed error messages

2. **ML Predictions Fail**
   - Verify ML service is running
   - Check model files are present
   - Verify data connectivity

3. **Workflow Execution Fails**
   - Check all required services are running
   - Verify workflow templates are available
   - Check agent availability

### Logs

- **Backend**: `docker-compose logs backend`
- **Agent OS**: `docker-compose logs agent-os`
- **ML Service**: `docker-compose logs ml-service`

## Future Enhancements

### Planned Features

1. **Advanced Agent Types**
   - Sentiment analysis agent
   - News analysis agent
   - Social media monitoring agent

2. **Enhanced Workflows**
   - Custom workflow creation
   - Workflow scheduling
   - Workflow versioning

3. **Advanced Analytics**
   - Real-time performance monitoring
   - Predictive analytics
   - Anomaly detection

4. **Machine Learning Improvements**
   - Model ensemble methods
   - Online learning capabilities
   - A/B testing framework

## Support

For issues and questions:

1. Check the logs for error messages
2. Review the test results
3. Consult the API documentation
4. Check service health endpoints

## API Documentation

- **Backend API**: `http://localhost:3001/docs`
- **Agent OS API**: `http://localhost:8001/docs`
- **ML Service API**: `http://localhost:8000/docs` 