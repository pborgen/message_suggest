# message_suggest (monorepo)

iMessage extension + backend for reply suggestions.

## Structure
- `services/backend/` – Express server that calls OpenAI and returns JSON suggestions
- `apps/ios/` – iMessage extension code snippet (UIKit) + integration notes

## Quick Start (backend)
```bash
cd services/backend
cp .env.example .env
npm install
npm run dev
```

## iOS
Open Xcode → New Project → App → include Messages Extension, then replace `MessagesViewController.swift` with the file in `apps/ios/`.
