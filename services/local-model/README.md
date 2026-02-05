# local-model service

A local stub that implements the `/generate` endpoint expected by the backend.

## Run
```bash
cd services/local-model
cp .env.example .env
pnpm install
pnpm dev
```

## Endpoint
`POST /generate`

Request:
```json
{
  "prompt": "...",
  "max_new_tokens": 300,
  "temperature": 0.7
}
```

Response:
```json
{ "generated_text": "{\"short\":[...],\"long\":\"...\"}" }
```

## macOS (llama.cpp)

### Quick Setup (Automated)
```bash
cd services/local-model
./setup-llamacpp.sh
```

This will:
1. Install llama.cpp via Homebrew (you may need to fix permissions first)
2. Download the TinyLlama model (~700MB)
3. Create `.env` file if it doesn't exist

### Manual Setup
If you prefer manual setup or need to fix Homebrew permissions:
```bash
# Fix Homebrew permissions (if needed)
sudo chown -R $(whoami) /opt/homebrew /Users/$(whoami)/Library/Logs/Homebrew

# Install llama.cpp
brew install llama.cpp

# Download model
mkdir -p models
cd models
curl -L -o tinyllama.gguf \
  https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf
cd ..
```

### Running

**Terminal 1 - Start llama.cpp server:**
```bash
cd services/local-model
./start-llamacpp.sh
```

Or manually:
```bash
llama-server -m ./models/tinyllama.gguf -c 2048 -ngl 1 --port 8081
```

**Terminal 2 - Start local-model service:**
```bash
cd services/local-model
pnpm install
pnpm dev
```

**Stop llama.cpp server:**
```bash
cd services/local-model
./stop-llamacpp.sh
```

The `.env` file is already configured with:
```
LOCAL_ENGINE=llamacpp
LLAMACPP_URL=http://localhost:8081/completion
```

Swap `generateFromPrompt` with your GPU inference (vLLM, TGI, etc.).
