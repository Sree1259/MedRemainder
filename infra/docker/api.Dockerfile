FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY services/api/package*.json ./
RUN npm ci

# Copy source
COPY services/api/ .

# Build (for production)
FROM base AS production
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/server.js"]

# Dev mode
FROM base AS development
EXPOSE 4000
CMD ["npm", "run", "dev"]
