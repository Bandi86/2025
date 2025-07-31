# Use Node.js 18 Debian as base image for better Prisma compatibility
FROM node:18-slim

# Install curl for health checks and required dependencies
RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Clean npm cache
RUN npm cache clean --force

# Expose port
EXPOSE 3001

# Health check - using a simple endpoint that exists
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{}' | grep -E "(200|400)" || exit 1

# Start the application
CMD ["node", "dist/src/main.js"] 