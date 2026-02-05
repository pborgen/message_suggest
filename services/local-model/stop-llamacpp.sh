#!/bin/bash

echo "🛑 Stopping llama.cpp server..."

# Find llama-server process
PID=$(pgrep -f "llama-server.*tinyllama.gguf" | head -1)

if [ -z "$PID" ]; then
  # Try alternative pattern (in case path is different)
  PID=$(pgrep -f "llama-server" | head -1)
fi

if [ -z "$PID" ]; then
  echo "   ℹ️  No running llama-server process found"
  exit 0
fi

echo "   Found process: PID $PID"
echo "   Stopping..."

# Try graceful shutdown first (SIGTERM)
kill "$PID" 2>/dev/null

# Wait a moment for graceful shutdown
sleep 2

# Check if still running, force kill if needed
if kill -0 "$PID" 2>/dev/null; then
  echo "   Process still running, forcing shutdown..."
  kill -9 "$PID" 2>/dev/null
  sleep 1
fi

# Verify it's stopped
if kill -0 "$PID" 2>/dev/null; then
  echo "   ❌ Failed to stop process"
  exit 1
else
  echo "   ✅ llama-server stopped"
  exit 0
fi