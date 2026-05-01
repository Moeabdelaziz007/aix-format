# Skill: Vercel Deployment Fix

## The Problem
Vercel tries to install from wrong path → `ENOENT` error
Command: `npm install --prefix apps/studio`
Error: `/vercel/path0/apps/studio/apps/studio/package.json` not found

## The Fix (do this ONCE)
In Vercel Dashboard → `aix-format-studio` project:
- **Root Directory**: `apps/studio`
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

OR create `apps/studio/vercel.json`:
```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build", 
  "outputDirectory": ".next"
}
```

## ENV Variables Required in Vercel
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `GROQ_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `NEXT_PUBLIC_PI_APP_ID`
- `STRIPE_SECRET_KEY`
- `NEXTAUTH_SECRET`

## After Deploy Checklist
- [ ] `/api/health` returns `{ status: "ok" }`
- [ ] `/api/registry` returns agents list
- [ ] `/builder` page loads Voice Wizard
- [ ] `/.well-known/agent.aix.json` returns valid JSON
