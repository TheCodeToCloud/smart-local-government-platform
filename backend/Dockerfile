# Dockerfile — Smart Gov Backend
# ─────────────────────────────────────────────────────────────────
# Multi-stage build is overkill for a Node API.
# This single-stage Dockerfile is correct and production-ready.
# Uses node:20-alpine (LTS) instead of 18 for latest security patches.

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Add non-root user for security (prevents running as root in container)
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Install dependencies first (leverages Docker layer caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy app source
COPY . .

# Drop root privileges before starting
USER appuser

# Expose the port the app listens on (Render sets PORT env var automatically)
EXPOSE 10000

# Health check so Docker/Render knows the container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-10000}/health || exit 1

# Start the server
CMD ["node", "server.js"]
