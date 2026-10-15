# ==============================================================================
# EmployeeHub — Production Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Dependency resolution and pruning
FROM node:22-alpine AS deps
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Final minimal production image
FROM node:22-alpine AS runner
WORKDIR /usr/src/app

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=3000

# Install curl for docker healthcheck
RUN apk add --no-cache curl

# Copy production node_modules from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Copy application assets, server code, and migrations
COPY server/ ./server/
COPY css/ ./css/
COPY js/ ./js/
COPY index.html ./

# Create data directory with permissions for node user (if running embedded SQLite)
RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app

# Switch to unprivileged user for security compliance
USER node

# Expose internal application port
EXPOSE 3000

# Container healthcheck against /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start production server
CMD ["node", "server/index.js"]
