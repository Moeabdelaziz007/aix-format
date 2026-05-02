# Frontend Rollback Strategy - Vercel Deployment

## Overview
This document outlines the rollback strategy specifically for the TurboQuantoTopology Protocol frontend deployed on Vercel, focusing on UI/UX continuity and rapid recovery.

## Table of Contents
1. [Vercel Deployment Rollback](#vercel-deployment-rollback)
2. [Frontend State Management](#frontend-state-management)
3. [UI/UX Rollback Considerations](#uiux-rollback-considerations)
4. [Environment Variables](#environment-variables)
5. [Static Assets & CDN](#static-assets--cdn)
6. [Client-Side Cache](#client-side-cache)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Post-Rollback Validation](#post-rollback-validation)

---

## Vercel Deployment Rollback

### Quick Rollback (< 2 minutes)

#### Via Vercel Dashboard
1. Navigate to: https://vercel.com/[team]/aix-format/deployments
2. Find the last stable deployment (marked with ✅)
3. Click "..." menu → "Promote to Production"
4. Confirm promotion

#### Via Vercel CLI
```bash
# Step 1: List recent deployments
vercel ls --scope production

# Output example:
# Age  Deployment                              Status    Duration
# 5m   aix-format-abc123.vercel.app           Ready     45s
# 1h   aix-format-xyz789.vercel.app (current) Ready     52s
# 2h   aix-format-def456.vercel.app           Ready     48s

# Step 2: Rollback to previous deployment
vercel rollback aix-format-xyz789.vercel.app --scope production

# Or promote specific deployment
vercel promote aix-format-xyz789.vercel.app --scope production
```

#### Automated Rollback Script
```bash
#!/bin/bash
# scripts/frontend-rollback.sh

set -e

echo "🔄 Starting frontend rollback..."

# Get current deployment
CURRENT=$(vercel ls --scope production | grep "current" | awk '{print $2}')
echo "Current deployment: $CURRENT"

# Get previous stable deployment (2nd in list)
PREVIOUS=$(vercel ls --scope production | grep "Ready" | sed -n '2p' | awk '{print $2}')
echo "Rolling back to: $PREVIOUS"

# Confirm rollback
read -p "Proceed with rollback? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel promote $PREVIOUS --scope production
    echo "✅ Rollback completed!"
    
    # Verify new deployment
    sleep 10
    curl -f https://aix-format.vercel.app/api/health || echo "⚠️ Health check failed"
else
    echo "❌ Rollback cancelled"
fi
```

### Rollback Triggers

#### Automatic Triggers (via monitoring)
```typescript
// apps/studio/src/lib/deployment-monitor.ts
import { monitoringService } from './monitoring';

export async function checkDeploymentHealth(): Promise<boolean> {
  const metrics = await monitoringService.getMetrics();
  
  // Trigger rollback if:
  const shouldRollback = 
    metrics.errorRate > 5 ||           // Error rate > 5%
    metrics.p95ResponseTime > 3000 ||  // Response time > 3s
    metrics.crashRate > 1 ||           // Any crashes
    metrics.consoleErrors > 50;        // Too many console errors
  
  if (shouldRollback) {
    await triggerRollback({
      reason: 'Automatic health check failure',
      metrics
    });
  }
  
  return !shouldRollback;
}
```

#### Manual Triggers
- **Visual Regression**: UI looks broken
- **User Reports**: Multiple complaints within 5 minutes
- **Feature Malfunction**: Critical feature not working
- **Performance Degradation**: Page load > 5s

---

## Frontend State Management

### Local Storage Rollback
```typescript
// apps/studio/src/lib/state-rollback.ts

export interface StateBackup {
  version: string;
  timestamp: number;
  data: {
    userPreferences: any;
    compressionProfiles: any;
    dqnState: any;
    sessionData: any;
  };
}

export function backupFrontendState(): StateBackup {
  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    timestamp: Date.now(),
    data: {
      userPreferences: localStorage.getItem('user_preferences'),
      compressionProfiles: localStorage.getItem('compression_profiles'),
      dqnState: localStorage.getItem('dqn_state'),
      sessionData: sessionStorage.getItem('session_data')
    }
  };
}

export function restoreFrontendState(backup: StateBackup): void {
  try {
    if (backup.data.userPreferences) {
      localStorage.setItem('user_preferences', backup.data.userPreferences);
    }
    if (backup.data.compressionProfiles) {
      localStorage.setItem('compression_profiles', backup.data.compressionProfiles);
    }
    if (backup.data.dqnState) {
      localStorage.setItem('dqn_state', backup.data.dqnState);
    }
    if (backup.data.sessionData) {
      sessionStorage.setItem('session_data', backup.data.sessionData);
    }
    
    console.log('✅ Frontend state restored from backup');
  } catch (error) {
    console.error('❌ Failed to restore frontend state:', error);
  }
}

export function clearFrontendState(): void {
  localStorage.clear();
  sessionStorage.clear();
  console.log('🧹 Frontend state cleared');
}
```

### Migration Strategy for State Changes
```typescript
// apps/studio/src/lib/state-migration.ts

export function migrateStateOnRollback(fromVersion: string, toVersion: string): void {
  console.log(`Migrating state from ${fromVersion} to ${toVersion}`);
  
  // Example: v2.0.0 → v1.9.0 rollback
  if (fromVersion === '2.0.0' && toVersion === '1.9.0') {
    // Remove new fields that don't exist in v1.9.0
    const profiles = JSON.parse(localStorage.getItem('compression_profiles') || '{}');
    delete profiles.advancedFeatures; // New in v2.0.0
    localStorage.setItem('compression_profiles', JSON.stringify(profiles));
  }
}
```

---

## UI/UX Rollback Considerations

### Visual Regression Prevention
```typescript
// apps/studio/src/components/RollbackSafeWrapper.tsx
import { useEffect, useState } from 'react';

export function RollbackSafeWrapper({ children }: { children: React.ReactNode }) {
  const [isCompatible, setIsCompatible] = useState(true);
  
  useEffect(() => {
    // Check if current state is compatible with deployed version
    const deployedVersion = process.env.NEXT_PUBLIC_APP_VERSION;
    const stateVersion = localStorage.getItem('app_version');
    
    if (stateVersion && deployedVersion && stateVersion !== deployedVersion) {
      console.warn(`Version mismatch: State=${stateVersion}, Deployed=${deployedVersion}`);
      
      // Clear incompatible state
      if (shouldClearState(stateVersion, deployedVersion)) {
        localStorage.clear();
        window.location.reload();
      }
    }
  }, []);
  
  if (!isCompatible) {
    return <div>Loading compatible version...</div>;
  }
  
  return <>{children}</>;
}

function shouldClearState(stateVersion: string, deployedVersion: string): boolean {
  // Clear state if major version changed
  const [stateMajor] = stateVersion.split('.');
  const [deployedMajor] = deployedVersion.split('.');
  return stateMajor !== deployedMajor;
}
```

### Feature Flag Rollback
```typescript
// apps/studio/src/lib/feature-flags.ts

export const FEATURE_FLAGS = {
  DQN_LEARNING: process.env.NEXT_PUBLIC_FEATURE_DQN === 'true',
  ADVANCED_COMPRESSION: process.env.NEXT_PUBLIC_FEATURE_ADVANCED === 'true',
  REAL_TIME_METRICS: process.env.NEXT_PUBLIC_FEATURE_METRICS === 'true',
  AUTO_PROFILE_UPDATES: process.env.NEXT_PUBLIC_FEATURE_AUTO_UPDATE === 'true'
};

// Graceful degradation when features are disabled
export function useFeature(featureName: keyof typeof FEATURE_FLAGS) {
  const [isEnabled, setIsEnabled] = useState(FEATURE_FLAGS[featureName]);
  
  useEffect(() => {
    // Listen for feature flag updates
    const handleFlagUpdate = (event: CustomEvent) => {
      if (event.detail.feature === featureName) {
        setIsEnabled(event.detail.enabled);
      }
    };
    
    window.addEventListener('feature-flag-update', handleFlagUpdate as EventListener);
    return () => window.removeEventListener('feature-flag-update', handleFlagUpdate as EventListener);
  }, [featureName]);
  
  return isEnabled;
}
```

### UI Component Versioning
```typescript
// apps/studio/src/components/MetricsDisplay/index.tsx
import { MetricsDisplayV1 } from './v1';
import { MetricsDisplayV2 } from './v2';

export function MetricsDisplay(props: MetricsDisplayProps) {
  const version = process.env.NEXT_PUBLIC_METRICS_VERSION || 'v1';
  
  // Render appropriate version based on deployment
  switch (version) {
    case 'v2':
      return <MetricsDisplayV2 {...props} />;
    case 'v1':
    default:
      return <MetricsDisplayV1 {...props} />;
  }
}
```

---

## Environment Variables

### Critical Environment Variables
```bash
# .env.production
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_REDIS_URL=redis://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Feature flags
NEXT_PUBLIC_FEATURE_DQN=false
NEXT_PUBLIC_FEATURE_ADVANCED=false
NEXT_PUBLIC_FEATURE_METRICS=true
NEXT_PUBLIC_FEATURE_AUTO_UPDATE=false

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=...
NEXT_PUBLIC_ANALYTICS_ID=...
```

### Rollback Environment Variables
```bash
# Quick disable features during rollback
vercel env add NEXT_PUBLIC_FEATURE_DQN false --scope production
vercel env add NEXT_PUBLIC_FEATURE_ADVANCED false --scope production

# Revert API endpoint
vercel env add NEXT_PUBLIC_API_URL https://api-stable.example.com --scope production

# Trigger rebuild with new env vars
vercel --prod
```

### Environment Variable Backup
```bash
#!/bin/bash
# scripts/backup-env-vars.sh

# Backup current production env vars
vercel env pull .env.production.backup --scope production

# Add timestamp
cp .env.production.backup ".env.production.backup.$(date +%Y%m%d-%H%M%S)"

echo "✅ Environment variables backed up"
```

---

## Static Assets & CDN

### Vercel Edge Network Cache
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
          }
        ]
      }
    ];
  }
};
```

### Cache Purging on Rollback
```bash
# Purge Vercel edge cache
curl -X PURGE https://aix-format.vercel.app/

# Or purge specific paths
curl -X PURGE https://aix-format.vercel.app/_next/static/chunks/main.js
curl -X PURGE https://aix-format.vercel.app/api/compression/profiles
```

### Asset Versioning Strategy
```typescript
// apps/studio/next.config.js
module.exports = {
  generateBuildId: async () => {
    // Use git commit hash for build ID
    return process.env.VERCEL_GIT_COMMIT_SHA || 'development';
  },
  
  // Ensure assets are versioned
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || ''
};
```

---

## Client-Side Cache

### Service Worker Rollback
```typescript
// apps/studio/public/sw.js
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Clear old caches on rollback
          if (cacheName !== CURRENT_CACHE_VERSION) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### IndexedDB Cleanup
```typescript
// apps/studio/src/lib/indexeddb-cleanup.ts

export async function cleanupIndexedDB(): Promise<void> {
  const databases = await indexedDB.databases();
  
  for (const db of databases) {
    if (db.name && db.name.startsWith('aix-')) {
      console.log('Deleting database:', db.name);
      indexedDB.deleteDatabase(db.name);
    }
  }
  
  console.log('✅ IndexedDB cleaned up');
}
```

---

## Monitoring & Alerts

### Real-Time Error Tracking
```typescript
// apps/studio/src/lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

export function initializeErrorTracking(): void {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
    
    beforeSend(event, hint) {
      // Trigger rollback alert if error rate spikes
      if (shouldTriggerRollback(event)) {
        fetch('/api/alerts/rollback', {
          method: 'POST',
          body: JSON.stringify({
            reason: 'High error rate detected',
            error: event
          })
        });
      }
      
      return event;
    }
  });
}

function shouldTriggerRollback(event: Sentry.Event): boolean {
  // Check error patterns that indicate deployment issues
  const criticalErrors = [
    'ChunkLoadError',
    'TypeError: Cannot read property',
    'ReferenceError',
    'SyntaxError'
  ];
  
  return criticalErrors.some(error => 
    event.message?.includes(error) || 
    event.exception?.values?.[0]?.type === error
  );
}
```

### Performance Monitoring
```typescript
// apps/studio/src/lib/performance-monitor.ts

export function monitorPerformance(): void {
  // Track Core Web Vitals
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    });
  }
}

function sendToAnalytics(metric: any): void {
  // Send to monitoring service
  fetch('/api/analytics/vitals', {
    method: 'POST',
    body: JSON.stringify(metric)
  });
  
  // Trigger alert if metrics degrade
  if (metric.name === 'LCP' && metric.value > 2500) {
    console.warn('⚠️ LCP degraded:', metric.value);
  }
}
```

### Vercel Analytics Integration
```typescript
// apps/studio/src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## Post-Rollback Validation

### Automated UI Tests
```typescript
// tests/e2e/post-rollback.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Post-Rollback Validation', () => {
  test('homepage renders correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check critical elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-display"]')).toBeVisible();
    
    // Check no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });
  
  test('compression profiles load', async ({ page }) => {
    await page.goto('/profiles');
    
    await expect(page.locator('[data-testid="profile-card"]')).toHaveCount(5);
  });
  
  test('API endpoints respond', async ({ page }) => {
    const response = await page.request.get('/api/compression/profiles');
    expect(response.ok()).toBeTruthy();
  });
  
  test('user interactions work', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test button clicks
    await page.click('[data-testid="refresh-metrics"]');
    await page.waitForResponse(resp => resp.url().includes('/api/metrics'));
    
    // Verify UI updates
    await expect(page.locator('[data-testid="last-updated"]')).toContainText('Just now');
  });
});
```

### Visual Regression Tests
```typescript
// tests/visual/rollback-visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression After Rollback', () => {
  test('dashboard matches baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 100
    });
  });
  
  test('metrics display matches baseline', async ({ page }) => {
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('[data-testid="metrics-display"]')).toHaveScreenshot('metrics.png');
  });
});
```

### Health Check Script
```bash
#!/bin/bash
# scripts/post-rollback-health.sh

echo "🏥 Running post-rollback health checks..."

# 1. Check homepage
echo "✓ Checking homepage..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aix-format.vercel.app)
if [ $STATUS -eq 200 ]; then
  echo "  ✅ Homepage: OK"
else
  echo "  ❌ Homepage: FAILED ($STATUS)"
  exit 1
fi

# 2. Check API health
echo "✓ Checking API..."
API_STATUS=$(curl -s https://aix-format.vercel.app/api/health | jq -r '.status')
if [ "$API_STATUS" = "healthy" ]; then
  echo "  ✅ API: OK"
else
  echo "  ❌ API: FAILED"
  exit 1
fi

# 3. Check critical pages
PAGES=("/" "/dashboard" "/profiles" "/metrics")
for PAGE in "${PAGES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://aix-format.vercel.app$PAGE")
  if [ $STATUS -eq 200 ]; then
    echo "  ✅ $PAGE: OK"
  else
    echo "  ❌ $PAGE: FAILED ($STATUS)"
    exit 1
  fi
done

# 4. Run Playwright tests
echo "✓ Running E2E tests..."
npm run test:e2e:rollback

echo "✅ All health checks passed!"
```

---

## Rollback Checklist

### Pre-Rollback
- [ ] Identify stable deployment to rollback to
- [ ] Backup current environment variables
- [ ] Notify team in #incidents channel
- [ ] Enable maintenance mode (optional)

### During Rollback
- [ ] Execute rollback via Vercel CLI or Dashboard
- [ ] Verify deployment promoted successfully
- [ ] Clear edge cache if needed
- [ ] Update feature flags if needed

### Post-Rollback
- [ ] Run automated health checks
- [ ] Execute E2E test suite
- [ ] Verify visual regression tests
- [ ] Check error rates in Sentry
- [ ] Monitor Core Web Vitals
- [ ] Confirm user reports resolved
- [ ] Document incident in post-mortem

### Communication
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Post in #incidents channel
- [ ] Schedule post-mortem meeting

---

## Quick Reference

### Emergency Rollback (One-Liner)
```bash
vercel rollback $(vercel ls --scope production | grep "Ready" | sed -n '2p' | awk '{print $2}') --scope production
```

### Disable All New Features
```bash
vercel env add NEXT_PUBLIC_FEATURE_DQN false --scope production && \
vercel env add NEXT_PUBLIC_FEATURE_ADVANCED false --scope production && \
vercel env add NEXT_PUBLIC_FEATURE_AUTO_UPDATE false --scope production && \
vercel --prod
```

### Clear All Caches
```bash
curl -X PURGE https://aix-format.vercel.app/ && \
redis-cli FLUSHDB && \
echo "localStorage.clear(); sessionStorage.clear();" | pbcopy
```

---

**Last Updated**: 2026-05-02  
**Owner**: Frontend Team  
**Emergency Contact**: devops@example.com