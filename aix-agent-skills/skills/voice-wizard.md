# Skill: Voice Wizard Flow

## What
3-step voice conversation that produces an AIX manifest JSON.
User speaks → AI asks questions → manifest is built turn by turn.

## Architecture
- **STT**: `POST /api/voice-wizard/transcribe` (Groq Whisper)
- **LLM**: `POST /api/voice-wizard/chat` (Gemini Flash)
- **TTS**: `POST /api/voice-wizard/speak` (Edge TTS)
- **Save**: `POST /api/voice-wizard/session` (Redis, TTL 24h)

## Manifest Building Pattern
Each conversation turn extracts ONE field:
- **Turn 1** → `agent.name`
- **Turn 2** → `agent.description`  
- **Turn 3** → `agent.capabilities[]`
- **Turn 4** → `agent.pricing.tier`
- **Turn 5** → `agent.identity.provider`

## The hook (useVoiceWizard.ts) MUST:
- Maintain state: `idle` | `listening` | `processing` | `speaking` | `complete`
- Auto-save to session after every turn
- Emit `onManifestReady(manifest)` when all 5 fields collected

## Constraints
- NEVER call LLM while microphone is open
- NEVER play TTS while recording
- ALWAYS show visual state (pulse = recording, spinner = processing)
- ALWAYS fallback to text input if microphone denied
