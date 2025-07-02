# Development stage
FROM node:20-alpine AS development

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Run the application in development mode
CMD ["npm", "run", "start:dev"]

# Production stage
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

# Install all dependencies first (including dev dependencies for Prisma)
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY --from=development /usr/src/app/dist ./dist

# Remove dev dependencies after generating Prisma client
RUN npm prune --production

CMD ["node", "dist/src/main.js"]
