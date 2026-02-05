# message_suggest (monorepo)

iMessage extension + backend for reply suggestions.

## Structure
- `services/backend/` – Express server that calls OpenAI and returns JSON suggestions
- `services/local-model/` – Local `/generate` endpoint stub for GPU inference
- `apps/ios/` – iMessage extension code snippet (UIKit) + integration notes
- `apps/sms-reply-starter/` – PyTorch training starter for reply generation

## Training starter
Start here: `apps/sms-reply-starter/README.md`

## Workspace (pnpm + turbo)
```bash
pnpm install
pnpm dev
```

## Quick Start (backend only)
```bash
cd services/backend
cp .env.example .env
pnpm install
pnpm dev
```

### Provider switch
Set in `services/backend/.env`:
- `MODEL_PROVIDER=openai` (default)
- `MODEL_PROVIDER=hf` (Hugging Face Inference API)
- `MODEL_PROVIDER=local` (your own GPU endpoint)
- `MODEL_PROVIDER=mock` (tests)

### Health + tests
- `GET /health` returns status + provider
- `pnpm --filter @message-suggest/backend test`
- `RUN_LLAMA_TESTS=1 pnpm --filter @message-suggest/backend test -- integration-llamacpp.test.ts`

## iOS
Open Xcode → New Project → App → include Messages Extension, then replace `MessagesViewController.swift` with the file in `apps/ios/`.
