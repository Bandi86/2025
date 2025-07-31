# TippMixMentor v2 - Football Prediction System

A comprehensive football prediction system that combines modern web technologies with machine learning to provide accurate match predictions and betting insights.

## 🚀 Features

### Authentication System
- **Secure User Registration & Login**: JWT-based authentication with refresh tokens
- **Role-Based Access Control**: User, Moderator, and Admin roles
- **Token Management**: Automatic token refresh and secure storage
- **Password Security**: Bcrypt hashing with salt rounds
- **Session Management**: Redis-based refresh token storage

### Backend Features
- **NestJS Microservices**: Scalable architecture with modular design
- **PostgreSQL Database**: Prisma ORM for type-safe database operations
- **Redis Caching**: High-performance caching for tokens and data
- **JWT Authentication**: Secure token-based authentication
- **API Documentation**: Swagger/OpenAPI documentation
- **Comprehensive Testing**: Unit and integration tests

### Agent OS Features
- **Intelligent Agents**: AI-powered agents for predictions and analysis
- **Task Management**: Automated task processing and queuing
- **Workflow Automation**: Multi-step workflow orchestration
- **Memory & Learning**: Persistent agent memory and learning capabilities
- **Real-time Monitoring**: Comprehensive metrics and health monitoring

### Frontend Features
- **Next.js 14**: App Router with Server and Client Components
- **TypeScript**: Full type safety across the application
- **Modern UI**: shadcn/ui components with Tailwind CSS
- **State Management**: Zustand for client-side state
- **Form Handling**: React Hook Form with Zod validation
- **Responsive Design**: Mobile-first responsive layout

## 🏗️ Architecture

### Backend Architecture
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── matches/        # Match data
│   │   ├── predictions/    # Prediction logic
│   │   ├── analytics/      # Analytics service
│   │   └── notifications/  # Notification system
│   ├── common/             # Shared utilities
│   └── config/             # Configuration files
├── prisma/                 # Database schema and migrations
└── test/                   # Test files

agent-os/
├── main.py                 # FastAPI application
├── core/                   # Core system components
├── agents/                 # Agent implementations
├── routers/                # API endpoints
└── requirements.txt        # Python dependencies
```

### Frontend Architecture
```
frontend/
├── src/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   └── ui/            # Base UI components
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand stores
│   └── lib/               # Utility functions
```

## 🔐 Authentication System

### Backend Authentication Features

#### JWT Token Management
- **Access Tokens**: Short-lived tokens (15 minutes) for API access
- **Refresh Tokens**: Long-lived tokens (7 days) stored in Redis
- **Automatic Refresh**: Client-side automatic token refresh
- **Token Validation**: Server-side token verification and validation

#### Security Features
- **Password Hashing**: Bcrypt with 12 salt rounds
- **Input Validation**: Class-validator with custom DTOs
- **Rate Limiting**: Request throttling for security
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet Security**: Security headers middleware

#### API Endpoints
```
POST /auth/register     # User registration
POST /auth/login        # User login
POST /auth/refresh      # Token refresh
POST /auth/logout       # User logout
GET  /users/profile     # Get user profile (protected)
PUT  /users/profile     # Update user profile (protected)
```

### Frontend Authentication Features

#### State Management
- **Zustand Store**: Centralized authentication state
- **Persistent Storage**: Local storage for token persistence
- **Auto-refresh**: Automatic token refresh before expiration
- **Error Handling**: Comprehensive error handling and user feedback

#### Components
- **LoginForm**: User login with validation
- **RegisterForm**: User registration with validation
- **AuthContainer**: Container for auth forms
- **ProtectedRoute**: Route protection component

#### Security Features
- **Token Storage**: Secure localStorage token management
- **Auto-logout**: Automatic logout on token expiration
- **Form Validation**: Client-side validation with Zod
- **Error Boundaries**: Graceful error handling

## 🧪 Testing

### Backend Tests
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

### Test Coverage
- **AuthService**: 100% coverage for authentication logic
- **AuthController**: 100% coverage for API endpoints
- **UsersService**: 100% coverage for user management
- **Integration Tests**: End-to-end authentication flow

### Frontend Tests
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and Redis credentials

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run start:dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev
```

### Docker Setup
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d agent-os

# View logs
docker-compose logs -f

# View Agent OS logs
docker-compose logs -f agent-os

# Stop services
docker-compose down
```

## 📊 API Documentation

Once the services are running, visit:
- **Backend Swagger UI**: http://localhost:3001/api
- **Backend Health**: http://localhost:3001/health
- **Agent OS Swagger UI**: http://localhost:8001/docs
- **Agent OS Health**: http://localhost:8001/health
- **ML Service Health**: http://localhost:8000/health

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tippmixmentor"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_AGENT_OS_URL="http://localhost:8001"
```

### Agent OS (env.example)
```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/tippmixmentor"
REDIS_URL="redis://redis:6379"
BACKEND_URL="http://backend:3001"
ML_SERVICE_URL="http://ml-service:8000"
DEBUG=true
LOG_LEVEL=INFO
```

## 🛡️ Security Best Practices

### Implemented Security Measures
1. **Password Security**: Bcrypt hashing with high salt rounds
2. **Token Security**: Short-lived access tokens with refresh mechanism
3. **Input Validation**: Server-side validation for all inputs
4. **CORS Protection**: Proper CORS configuration
5. **Rate Limiting**: Request throttling to prevent abuse
6. **Security Headers**: Helmet middleware for security headers
7. **SQL Injection Protection**: Prisma ORM with parameterized queries
8. **XSS Protection**: Input sanitization and output encoding

### Recommended Security Measures
1. **HTTPS**: Use HTTPS in production
2. **Environment Variables**: Never commit secrets to version control
3. **Regular Updates**: Keep dependencies updated
4. **Security Audits**: Regular security audits and penetration testing
5. **Monitoring**: Implement logging and monitoring
6. **Backup Strategy**: Regular database backups

## 📈 Performance Optimization

### Backend Optimizations
- **Redis Caching**: Token and data caching
- **Database Indexing**: Optimized database queries
- **Connection Pooling**: Database connection management
- **Compression**: Response compression middleware

### Frontend Optimizations
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack bundle analyzer
- **Lazy Loading**: Component and route lazy loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### v2.1.0 - Agent OS Integration
- ✅ Intelligent Agent Operating System
- ✅ Prediction agents with ML integration
- ✅ Automated task management and queuing
- ✅ Workflow automation and orchestration
- ✅ Agent memory and learning capabilities
- ✅ Real-time monitoring and metrics
- ✅ Comprehensive API documentation
- ✅ Docker containerization
- ✅ Health checks and monitoring
- ✅ Integration with existing services

### v2.0.0 - Authentication System
- ✅ Complete JWT authentication system
- ✅ User registration and login
- ✅ Role-based access control
- ✅ Token refresh mechanism
- ✅ Comprehensive test coverage
- ✅ Frontend authentication integration
- ✅ Secure password handling
- ✅ Redis token storage
- ✅ API documentation
- ✅ Modern UI components

---

**TippMixMentor v2** - The future of football predictions is here! ⚽🎯 