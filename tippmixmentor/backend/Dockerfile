# Multi-stage build for NestJS
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Development stage
FROM base AS development
WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Expose port
EXPOSE 3001

# Start in development mode
CMD ["pnpm", "run", "start:dev"]

# Production build stage
FROM base AS build
WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client and build
RUN pnpm prisma generate
RUN pnpm run build

# Production stage
FROM base AS production
WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3001

# Start in production mode
CMD ["node", "dist/main"]
