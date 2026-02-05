#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MODEL_PATH="$SCRIPT_DIR/models/tinyllama.gguf"

if [ ! -f "$MODEL_PATH" ]; then
  echo "❌ Model not found at $MODEL_PATH"
  echo "   Run ./setup-llamacpp.sh first to download the model"
  exit 1
fi

echo "🚀 Starting llama.cpp server..."
echo "   Model: $MODEL_PATH"
echo "   Port: 8081"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

cd "$SCRIPT_DIR"
llama-server -m "$MODEL_PATH" -c 2048 -ngl 1 --port 8081