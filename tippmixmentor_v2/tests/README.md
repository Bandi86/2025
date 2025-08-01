# TippMixMentor Testing Suite

Comprehensive end-to-end testing suite for the TippMixMentor football prediction system.

## 🎯 Overview

This testing suite provides comprehensive coverage for all aspects of the TippMixMentor system:

- **End-to-End User Workflow Testing**
- **WebSocket Real-time Testing**
- **Data Persistence Testing**
- **Performance Testing**
- **Integration Testing**

## 📋 Test Suites

### 1. End-to-End User Workflow Tests (`e2e_user_workflow_test.py`)

Tests complete user journeys and workflows:

- ✅ User registration and login flows
- ✅ Prediction creation and management
- ✅ Real-time match updates and notifications
- ✅ User profile management
- ✅ Data persistence across sessions
- ✅ Authentication and authorization
- ✅ Token refresh and validation

**Key Features:**
- Step-by-step workflow validation
- Detailed error reporting
- Session management testing
- Cross-browser compatibility simulation

### 2. WebSocket Real-time Tests (`websocket_realtime_test.py`)

Tests real-time communication features:

- ✅ Live match updates via WebSocket
- ✅ Agent performance updates
- ✅ User presence and notifications
- ✅ Multi-client scenarios
- ✅ Connection reliability and reconnection
- ✅ Message throughput testing
- ✅ Broadcasting and subscription systems

**Key Features:**
- Real-time message validation
- Connection stability testing
- Multi-client load testing
- Performance metrics collection

### 3. Data Persistence Tests (`data_persistence_test.py`)

Tests data integrity and persistence:

- ✅ User data persistence across sessions
- ✅ Prediction history management
- ✅ Agent task management
- ✅ Database integrity and constraints
- ✅ Data consistency validation
- ✅ Backup and restore functionality
- ✅ Performance under load

**Key Features:**
- Database constraint validation
- Data consistency checks
- Migration testing
- Performance benchmarking

### 4. Performance Tests (`performance_test.py`)

Tests system performance and scalability:

- ✅ Load testing with multiple concurrent users
- ✅ Real-time data throughput testing
- ✅ Database performance under load
- ✅ API endpoint performance
- ✅ WebSocket performance
- ✅ Memory usage testing
- ✅ Stress testing

**Key Features:**
- Concurrent user simulation
- Response time analysis
- Throughput measurement
- Resource usage monitoring

### 5. Integration Tests (`test_integration_complete.py`)

Tests complete system integration:

- ✅ Service availability and health checks
- ✅ Cross-service communication
- ✅ API gateway functionality
- ✅ ML service integration
- ✅ Agent OS integration
- ✅ Error handling and recovery

**Key Features:**
- Full system integration validation
- Service dependency testing
- Error scenario handling
- Recovery mechanism testing

## 🚀 Quick Start

### Prerequisites

1. **Docker Services Running**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Verify services are healthy
   docker-compose ps
   ```

2. **Python Environment**
   ```bash
   # Create virtual environment
   python -m venv test_env
   source test_env/bin/activate  # On Windows: test_env\Scripts\activate
   
   # Install dependencies
   pip install -r tests/requirements.txt
   ```

### Running Tests

#### Run All Tests
```bash
cd tests
python run_all_tests.py
```

#### Run Specific Test Suites
```bash
# Run only user workflow tests
python run_all_tests.py user_workflow

# Run performance and persistence tests
python run_all_tests.py performance persistence

# Run integration tests only
python run_all_tests.py integration
```

#### Run Individual Test Files
```bash
# User workflow tests
python e2e_user_workflow_test.py

# WebSocket tests
python websocket_realtime_test.py

# Performance tests
python performance_test.py

# Persistence tests
python data_persistence_test.py

# Integration tests
python test_integration_complete.py
```

## 📊 Test Reports

### Console Output
Each test suite provides detailed console output with:
- ✅/❌ Pass/Fail indicators
- Test duration and performance metrics
- Detailed error messages
- Step-by-step progress

### JSON Reports
Detailed reports are automatically saved to `reports/` directory:
- `test_report_YYYYMMDD_HHMMSS.json`
- Contains all test results and metrics
- Can be used for CI/CD integration

### Report Structure
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "start_time": "2024-01-15T10:25:00",
  "end_time": "2024-01-15T10:30:00",
  "total_duration": 300.5,
  "results": [
    {
      "test_suite": "User Workflow Tests",
      "success": true,
      "total_tests": 8,
      "passed_tests": 8,
      "failed_tests": 0,
      "success_rate": 100.0,
      "duration": 45.2,
      "details": { ... }
    }
  ]
}
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the tests directory:

```env
# Service URLs
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:8000
AGENT_OS_URL=http://localhost:8001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tippmixmentor

# Test Configuration
TEST_TIMEOUT=30
MAX_CONCURRENT_USERS=50
PERFORMANCE_TEST_DURATION=300
```

### Test Parameters
Modify test parameters in each test file:

```python
# Performance test parameters
CONCURRENT_USERS = 10
REQUESTS_PER_USER = 50
TEST_DURATION = 60

# WebSocket test parameters
WS_CONNECTIONS = 5
MESSAGE_COUNT = 100
TIMEOUT_SECONDS = 10
```

## 📈 Performance Benchmarks

### Expected Performance Metrics

| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| API Response Time | < 1s | < 500ms | < 200ms |
| WebSocket Latency | < 100ms | < 50ms | < 20ms |
| Database Queries | < 100ms | < 50ms | < 20ms |
| Concurrent Users | 50 | 100 | 200+ |
| Requests/Second | 100 | 500 | 1000+ |

### Performance Recommendations

1. **Response Times > 1s**: Optimize database queries, add caching
2. **Response Times > 500ms**: Consider Redis caching, query optimization
3. **WebSocket Latency > 100ms**: Check network, optimize message handling
4. **Concurrent Users < 50**: Scale horizontally, optimize resource usage

## 🐛 Troubleshooting

### Common Issues

#### 1. Services Not Available
```bash
# Check if all services are running
docker-compose ps

# Restart services if needed
docker-compose restart

# Check service logs
docker-compose logs backend
docker-compose logs ml-service
docker-compose logs agent-os
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# Reset database if needed
docker-compose down -v
docker-compose up -d
```

#### 3. WebSocket Connection Failures
```bash
# Check WebSocket endpoint
curl -I http://localhost:3001/ws

# Verify WebSocket gateway is running
docker-compose logs backend | grep websocket
```

#### 4. Performance Test Failures
```bash
# Check system resources
docker stats

# Increase Docker resources if needed
# Memory: 4GB+, CPU: 2+ cores
```

### Debug Mode
Enable debug mode for detailed logging:

```bash
# Set debug environment variable
export DEBUG=true

# Run tests with verbose output
python run_all_tests.py --verbose
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start Services
        run: docker-compose up -d
      - name: Wait for Services
        run: sleep 30
      - name: Install Dependencies
        run: pip install -r tests/requirements.txt
      - name: Run Tests
        run: cd tests && python run_all_tests.py
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: tests/reports/
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('Start Services') {
            steps {
                sh 'docker-compose up -d'
                sh 'sleep 30'
            }
        }
        stage('Run Tests') {
            steps {
                sh 'pip install -r tests/requirements.txt'
                sh 'cd tests && python run_all_tests.py'
            }
        }
        stage('Publish Results') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'tests/reports',
                    reportFiles: '*.html',
                    reportName: 'Test Results'
                ])
            }
        }
    }
}
```

## 📚 API Documentation

### Test Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User authentication |
| `/auth/profile` | GET | User profile |
| `/matches` | GET | Get matches |
| `/predictions` | POST | Create prediction |
| `/agents` | GET | Get agents |
| `/ws` | WebSocket | Real-time updates |

### Test Data Examples

#### User Registration
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPassword123!",
  "firstName": "Test",
  "lastName": "User"
}
```

#### Prediction Creation
```json
{
  "matchId": "match_123",
  "predictedHomeScore": 2,
  "predictedAwayScore": 1,
  "confidence": 0.8,
  "betType": "MATCH_RESULT",
  "notes": "Test prediction"
}
```

## 🤝 Contributing

### Adding New Tests

1. **Create Test File**
   ```python
   # tests/new_feature_test.py
   class NewFeatureTestRunner:
       async def test_new_feature(self):
           # Test implementation
           pass
   ```

2. **Update Master Runner**
   ```python
   # tests/run_all_tests.py
   available_suites = {
       "new_feature": self.run_new_feature_tests,
       # ... existing suites
   }
   ```

3. **Add Dependencies**
   ```bash
   # tests/requirements.txt
   new-testing-library>=1.0.0
   ```

### Test Guidelines

1. **Naming Convention**: Use descriptive test names
2. **Error Handling**: Always handle exceptions gracefully
3. **Cleanup**: Clean up test data after tests
4. **Documentation**: Document complex test scenarios
5. **Performance**: Keep individual tests under 30 seconds

## 📞 Support

For issues and questions:

1. **Check Troubleshooting Section** above
2. **Review Service Logs**: `docker-compose logs [service]`
3. **Run Individual Tests** to isolate issues
4. **Check System Resources** during performance tests

## 📄 License

This testing suite is part of the TippMixMentor project and follows the same license terms. 