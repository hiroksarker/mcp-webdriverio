# Build stage
FROM node:18-slim AS builder

# Set working directory
WORKDIR /build

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Development stage
FROM node:18-slim AS development

# Install Chrome and required dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    xvfb \
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
ENV DISPLAY=:99
ENV PATH="/app/node_modules/.bin:${PATH}"

# Create app directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install all dependencies including types
RUN npm install \
    && npm install --save-dev \
        typescript@latest \
        ts-node@latest \
        nodemon@latest \
        @types/jest \
        @types/mocha \
        @types/chai \
        @types/node \
        jest \
        ts-jest

# Create directories for screenshots and uploads
RUN mkdir -p /app/screenshots /app/uploads

# Copy and set up entrypoint script before switching user
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set ownership and switch to non-root user
RUN chown -R node:node /app /usr/local/bin/docker-entrypoint.sh
USER node

# Set environment variables
ENV NODE_ENV=development

# Use the startup script as entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-slim AS production

# Install only necessary runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    xvfb \
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
ENV DISPLAY=:99

# Create app directory
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package*.json ./

# Install only production dependencies
RUN npm ci --only=production \
    && npm cache clean --force \
    && rm -rf /root/.npm

# Create directories for screenshots and uploads
RUN mkdir -p /app/screenshots /app/uploads

# Copy and set up entrypoint script before switching user
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set ownership and switch to non-root user
RUN chown -R node:node /app /usr/local/bin/docker-entrypoint.sh
USER node

# Set environment variables
ENV NODE_ENV=production

# Use the startup script as entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]