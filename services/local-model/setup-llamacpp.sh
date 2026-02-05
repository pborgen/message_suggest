#!/bin/bash
set -e

echo "🚀 Setting up llama.cpp for local-model service"
echo ""

# Step 1: Fix Homebrew permissions (if needed)
echo "📦 Step 1: Installing llama.cpp via Homebrew..."
echo "   If you see permission errors, run this first:"
echo "   sudo chown -R $(whoami) /opt/homebrew /Users/$(whoami)/Library/Logs/Homebrew"
echo ""
brew install llama.cpp

# Step 2: Download TinyLlama model
echo ""
echo "📥 Step 2: Downloading TinyLlama model..."
cd "$(dirname "$0")"
mkdir -p models
cd models

if [ ! -f "tinyllama.gguf" ]; then
  echo "   Downloading tinyllama.gguf (this may take a few minutes)..."
  curl -L -o tinyllama.gguf \
    https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf
  echo "   ✅ Model downloaded!"
else
  echo "   ✅ Model already exists, skipping download"
fi

# Step 3: Check/create .env file
echo ""
echo "⚙️  Step 3: Setting up .env file..."
cd "$(dirname "$0")"
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "   ✅ Created .env from .env.example"
else
  echo "   ✅ .env already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the llama.cpp server, run:"
echo "  cd $(dirname "$0")"
echo "  llama-server -m ./models/tinyllama.gguf -c 2048 -ngl 1 --port 8081"
echo ""
echo "Then in another terminal, start the local-model service:"
echo "  cd $(dirname "$0")"
echo "  pnpm install && pnpm dev"