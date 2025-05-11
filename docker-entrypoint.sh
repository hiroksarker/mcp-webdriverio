#!/bin/sh
set -e

# Clean up any existing Xvfb lock file
rm -f /tmp/.X99-lock

# Start Xvfb
Xvfb :99 -screen 0 1024x768x16 &
XVFB_PID=$!

# Wait for Xvfb to be ready
sleep 1

# Verify Xvfb is running
if ! ps -p $XVFB_PID > /dev/null; then
    echo "Failed to start Xvfb"
    exit 1
fi

# Execute the main command with proper PATH
export PATH="/app/node_modules/.bin:$PATH"
exec "$@"

# Cleanup on exit
trap "kill $XVFB_PID; rm -f /tmp/.X99-lock" EXIT 