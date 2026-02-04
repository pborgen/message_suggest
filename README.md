# message_suggest (monorepo)

iMessage extension + backend for reply suggestions.

## Structure
- `services/backend/` – Express server that calls OpenAI and returns JSON suggestions
- `apps/ios/` – iMessage extension code snippet (UIKit) + integration notes

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

### Health + tests
- `GET /health` returns status + provider
- `pnpm --filter @message-suggest/backend test`

## iOS
Open Xcode → New Project → App → include Messages Extension, then replace `MessagesViewController.swift` with the file in `apps/ios/`.
