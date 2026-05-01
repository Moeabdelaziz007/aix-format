# Skill: API Route Standard

## File Location
- `apps/studio/src/app/api/{resource}/route.ts`
- `apps/studio/src/app/api/{resource}/[id]/route.ts`

## Standard Response Shape (ALWAYS)
- **Success**: `{ data: T, meta?: { count, page } }`
- **Error**: `{ error: string, code: string, details?: any }`

## Auth Pattern
```typescript
import { getSession } from '@/lib/auth';

const session = await getSession(req);
if (!session) {
  return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
}
```

## Redis Pattern
```typescript
import { redis } from '@/lib/redis';

// Keys MUST use NS namespace:
const KEY = `aix:${resource}:${id}`; 
```

## Rate Limiting Pattern
```typescript
import { checkRateLimit } from '@/lib/mcp-router';

const allowed = await checkRateLimit(session.userId, 'api-call');
if (!allowed) {
  return Response.json({ error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
}
```

## Constraints
- NEVER return raw Redis data without parsing.
- NEVER skip auth on mutating endpoints (POST/PUT/DELETE).
- ALWAYS use try/catch with structured error response.
- ALWAYS log errors to `console.error` with request context.
