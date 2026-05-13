# AIX Format Production Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **Upstash Redis**: Create instance at https://upstash.com
3. **Pi Network Developer Account**: Register at https://developers.minepi.com
4. **AxiomID Account**: Get API key from https://axiomid.app

## Step 1: Configure Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
cd apps/studio
vercel link
```

## Step 2: Set Environment Variables

### Required Variables (set in Vercel dashboard)

```bash
# Core
AIX_UID_HASH_SALT=<generate-random-32-char-string>

# Upstash Redis (with TLS)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>

# Pi Network Testnet
PI_API_KEY=<your-pi-api-key>
PI_WALLET_ADDRESS=<your-wallet-address>

# AxiomID
AXIOM_API_KEY=<your-axiom-key>

# Security
JWT_SECRET=<generate-random-64-char-string>
ZK_VERIFICATION_KEY=<your-zk-key-json>

# Optional: Monitoring
SENTRY_DSN=<your-sentry-dsn>
```

### Set via Vercel CLI

```bash
# Production
vercel env add AIX_UID_HASH_SALT production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add PI_API_KEY production
vercel env add PI_WALLET_ADDRESS production
vercel env add AXIOM_API_KEY production
vercel env add JWT_SECRET production
vercel env add ZK_VERIFICATION_KEY production

# Preview (optional)
vercel env add AIX_UID_HASH_SALT preview
# ... repeat for preview environment

# Development (optional)
vercel env add AIX_UID_HASH_SALT development
# ... repeat for development environment
```

## Step 3: Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or use GitHub integration (recommended)
# Push to main branch and Vercel will auto-deploy
```

## Step 4: Verify Deployment

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-02T17:56:00.000Z",
  "version": "1.0.0"
}
```

### Redis Health Check
```bash
curl https://your-app.vercel.app/api/health/redis
```

Expected response:
```json
{
  "status": "ok",
  "redis": "connected",
  "latency": 45
}
```

## Step 5: Run E2E Tests

```bash
# Set production URL
export VERCEL_URL=https://your-app.vercel.app

# Run E2E KYC flow tests
cd packages/pi-kyc
npm test -- tests/e2e-pi-network.test.ts

# Run ZK-KYC security audit
cd packages/aix-zkkyc
npm test -- tests/security-audit.test.ts
```

## Step 6: Monitor & Rollback

### Enable Monitoring

1. **Vercel Analytics**: Enabled by default
2. **Sentry Error Tracking**: Configure SENTRY_DSN
3. **Custom Metrics**: Check `/api/analytics`

### Rollback Strategy

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>

# Or use Vercel dashboard:
# 1. Go to Deployments tab
# 2. Find stable deployment
# 3. Click "Promote to Production"
```

## Troubleshooting

### Redis Connection Issues

```bash
# Test Redis connection
curl https://your-app.vercel.app/api/health/redis

# Check TLS configuration
# Ensure REDIS_TLS_ENABLED=true in environment variables
```

### Pi Network Authentication Failures

```bash
# Verify API key
curl -H "Authorization: Key ${PI_API_KEY}" \
  https://api.minepi.com/v2/me

# Check sandbox environment
# Ensure PI_NETWORK_ENV=sandbox
```

### AxiomID DID Resolution Errors

```bash
# Test DID resolver
curl https://resolver.axiomid.app/v1/did:axiom:test

# Verify API key
curl -H "X-API-Key: ${AXIOM_API_KEY}" \
  https://registry.axiomid.app/v1/health
```

## Security Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] JWT_SECRET is strong random string (64+ chars)
- [ ] SKIP_SIGNATURE_VERIFICATION=false in production
- [ ] Redis TLS enabled
- [ ] Sentry DSN configured for error tracking
- [ ] Rate limiting enabled on API routes
- [ ] CORS headers properly configured
- [ ] ZK proof verification working
- [ ] Nullifier registry preventing replay attacks

## Performance Optimization

1. **Edge Functions**: API routes run on Edge (configured in vercel.json)
2. **Redis Caching**: Upstash Redis with TLS for fast access
3. **CDN**: Static assets served via Vercel CDN
4. **Compression**: Gzip/Brotli enabled by default

## Post-Deployment Tasks

1. **Update DNS**: Point custom domain to Vercel
2. **SSL Certificate**: Auto-provisioned by Vercel
3. **Monitoring**: Set up alerts in Sentry
4. **Documentation**: Update API docs with production URL
5. **Team Access**: Invite team members to Vercel project

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Upstash Docs**: https://docs.upstash.com
- **Pi Network Docs**: https://developers.minepi.com/doc
- **AxiomID Docs**: https://docs.axiomid.app