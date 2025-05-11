# Build stage
FROM node:18-slim AS builder

# Set working directory
WORKDIR /build

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-slim

# Install only necessary runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    firefox-esr \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set Chrome binary path for WebdriverIO
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_PATH=/usr/lib/chromium/

# Create app directory
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package*.json ./

# Install only production dependencies
RUN npm ci --only=production \
    && npm cache clean --force

# Create directories for screenshots and uploads
RUN mkdir -p /app/screenshots /app/uploads \
    && chown -R node:node /app

# Switch to non-root user for security
USER node

# Set environment variables
ENV NODE_ENV=production

# Command to run the server
CMD ["node", "dist/lib/server.js"]