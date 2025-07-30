# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NODE_ENV development

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start development server
CMD ["npm", "run", "dev"] 