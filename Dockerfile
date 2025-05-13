# Use Node.js LTS version
FROM node:18-slim

# Install Chrome and required dependencies for WebdriverIO
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Set environment variables for Chrome
ENV CHROME_BIN=/usr/bin/chromium
ENV DISPLAY=:99

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port for MCP server
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"] 