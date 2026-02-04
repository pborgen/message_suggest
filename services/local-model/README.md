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
Install llama.cpp and run its server:
```bash
brew install llama.cpp
# download a small GGUF model
mkdir -p models
cd models
curl -L -o tinyllama.gguf \
  https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf

# start llama.cpp server
llama-server -m ./tinyllama.gguf -c 2048 -ngl 1 --port 8081
```

Then run this service with:
```
LOCAL_ENGINE=llamacpp
LLAMACPP_URL=http://localhost:8081/completion
```

Swap `generateFromPrompt` with your GPU inference (vLLM, TGI, etc.).
