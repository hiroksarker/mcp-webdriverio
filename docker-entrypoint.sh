#!/bin/bash
set -e

# Start Xvfb
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
XVFB_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Cleaning up..."
    kill $XVFB_PID
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGTERM SIGINT

# Start the MCP server
echo "Starting MCP WebdriverIO server..."
exec node dist/bin/mcp-webdriverio.js "$@" 