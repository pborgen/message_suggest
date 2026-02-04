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

Swap `generateFromPrompt` with your GPU inference (vLLM, llama.cpp, TGI, etc.).
