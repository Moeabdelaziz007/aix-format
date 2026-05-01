# Skill: Agent Memory System

## What
Every agent in AIX has persistent memory stored in Upstash Redis.
Memory = list of conversation turns, capped at 50 entries, TTL 30 days.

## Redis Key Pattern
agent:{agentId}:memory  → Redis List (LPUSH/LRANGE)
agent:{agentId}:skills  → Redis Set  (SADD/SMEMBERS)
agent:{agentId}:context → Redis Hash (HSET/HGETALL)

## API Route Pattern
Always create under: apps/studio/src/app/api/agents/[id]/{resource}/route.ts

## Code Pattern (ALWAYS use this exact structure)
```typescript
import { redis } from '@/lib/redis';

export async function GET(req, { params }) {
  const data = await redis.lrange(`agent:${params.id}:memory`, 0, -1);
  return Response.json({ data: data.map(d => JSON.parse(d)) });
}
```

## Constraints
- NEVER store memory in localStorage
- NEVER exceed 50 entries per agent (use LTRIM)
- ALWAYS parse/stringify JSON in Redis
- ALWAYS add TTL on write

## Test it works
```bash
curl POST /api/agents/test-123/memory -d '{"role":"user","content":"hello"}'
curl GET  /api/agents/test-123/memory
# -> Should return [{role:"user", content:"hello"}]
```
