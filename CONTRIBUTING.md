# Contributing

## Setup
  git clone https://github.com/Moeabdelaziz007/aix-format
  cd apps/studio && npm install
  npm run dev   # localhost:3000

## Before EVERY commit — non-negotiable:
  cd apps/studio
  npm run build        # must pass
  npx tsc --noEmit    # must pass

## Commit format:
  feat(studio): description
  fix(core): description
  docs: description
  ci: description
  test(core): description

## Code rules:
  - 'use client' → first line on all hook/browser files
  - @/ alias → always, never relative imports
  - localStorage → only inside useEffect + try/catch
  - AgentRecord → always from '@/lib/types'
  - ABOM → 'capabilities' never 'apis'
  - format_version → "1.3"
