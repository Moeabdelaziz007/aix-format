# Skill: AIX Skills System

## What
Skills are pluggable capabilities attached to agents.
They define WHAT an agent can DO beyond basic chat.

## Skills Registry (static, in /api/skills)
- **web-search**: tier: free
- **code-execution**: tier: builder
- **email-send**: tier: builder
- **voice-response**: tier: pro
- **shopify-connect**: tier: pro
- **abom-scan**: tier: enterprise
- **pi-payment**: tier: pro

## Agent ↔ Skill Relationship (Redis Set)
- **agent:{id}:skills**: Set of skillIds
- **Max skills per agent**: 10 (free=2, builder=5, pro=10, enterprise=unlimited)

## UI Pattern (skills page)
- Grid of skill cards
- Each card: icon + name + tier badge + toggle switch
- Toggle calls `POST`/`DELETE` `/api/agents/{id}/skills`
- Show "Upgrade required" if tier too low

## When Voice Wizard asks about skills
Extract from phrases like:
- "can search the web" → `web-search`
- "can send emails" → `email-send`
- "can run code" → `code-execution`
