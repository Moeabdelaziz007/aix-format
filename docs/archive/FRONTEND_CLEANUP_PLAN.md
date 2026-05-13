# AIX Studio Frontend Cleanup Plan

**Version:** 1.0  
**Created:** 2026-05-02  
**Status:** Ready for Implementation  
**Estimated Duration:** 8 weeks

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Critical Fixes](#phase-1-critical-fixes-week-1-2)
3. [Phase 2: High Priority](#phase-2-high-priority-week-3-4)
4. [Phase 3: Medium Priority](#phase-3-medium-priority-week-5-6)
5. [Phase 4: Low Priority](#phase-4-low-priority-week-7-8)
6. [Dead Code Removal](#dead-code-removal-tasks)
7. [Consolidation Strategy](#consolidation-strategy)
8. [Missing Features Roadmap](#missing-features-roadmap)
9. [Code Quality Improvements](#code-quality-improvements)
10. [Test Coverage Expansion](#test-coverage-expansion)
11. [Success Metrics](#success-metrics)

---

## Overview

This cleanup plan addresses the findings from the comprehensive frontend audit. The plan is organized into 4 phases over 8 weeks, prioritized by impact and risk.

### Goals

- ✅ Eliminate all duplicate components
- ✅ Complete missing feature implementations
- ✅ Improve code quality and consistency
- ✅ Expand test coverage to 70%+
- ✅ Reduce bundle size by 30%
- ✅ Achieve 90+ accessibility score

### Team Requirements

- **Frontend Lead:** 1 person (full-time)
- **Frontend Developers:** 2 people (full-time)
- **QA Engineer:** 1 person (part-time)
- **Code Reviewer:** 1 person (part-time)

---

## Phase 1: Critical Fixes (Week 1-2)

**Priority:** CRITICAL  
**Duration:** 10 working days  
**Team:** 3 developers

### 1.1 Consolidate Duplicate Components (3 days)

#### Task 1.1.1: Migrate AgentCard Usage
**Effort:** 1.5 days  
**Assignee:** Frontend Dev 1

**Steps:**
1. Audit all AgentCard imports across codebase
2. Update imports to use unified version:
   ```typescript
   // OLD (to remove)
   import { AgentCard } from '@/components/marketplace/AgentCard'
   import { AgentCard } from '@/components/studio/AgentCard'
   
   // NEW (unified)
   import { AgentCard } from '@/components/agents/AgentCard'
   ```

3. Update props to match unified interface:
   ```typescript
   // Marketplace context
   <AgentCard 
     context="marketplace"
     item={marketplaceItem}
     view="grid"
     onClick={handleClick}
   />
   
   // Studio context
   <AgentCard
     context="studio"
     agent={agentRecord}
     showDeploy={true}
   />
   ```

4. Test all affected pages:
   - `/marketplace`
   - `/my-agents`
   - `/` (home)
   - `/agents/[id]`

**Files to Modify:**
- `apps/studio/src/app/marketplace/page.tsx`
- `apps/studio/src/app/my-agents/page.tsx`
- `apps/studio/src/app/page.tsx`
- `apps/studio/src/components/home/AgentsDashboard.tsx`

**Files to Delete:**
- `apps/studio/src/components/marketplace/AgentCard.tsx`
- `apps/studio/src/components/studio/AgentCard.tsx`

---

#### Task 1.1.2: Consolidate VoiceOrb
**Effort:** 1 day  
**Assignee:** Frontend Dev 2

**Steps:**
1. Analyze usage of both VoiceOrb implementations
2. Enhance unified VoiceOrb with feature flags:
   ```typescript
   interface VoiceOrbProps {
     mode?: 'simple' | 'full';
     onTranscript?: (text: string) => void;
     isProcessing?: boolean;
     // Simple mode props
     state?: VoiceState;
     onClick?: () => void;
   }
   ```

3. Update all imports to use `@/components/studio/VoiceOrb`
4. Remove simple version

**Files to Modify:**
- `apps/studio/src/components/studio/VoiceOrb.tsx` (add feature flags)
- `apps/studio/src/components/home/HeroSection.tsx`
- `apps/studio/src/app/page.tsx`

**Files to Delete:**
- `apps/studio/src/components/VoiceOrb.tsx`

---

#### Task 1.1.3: Deprecate Duplicate KYABadge
**Effort:** 0.5 days  
**Assignee:** Frontend Dev 1

**Steps:**
1. Update all imports to use sub-component version
2. Add deprecation notice to old version
3. Remove after migration complete

**Files to Modify:**
- `apps/studio/src/components/marketplace/AgentDetailModal.tsx`
- `apps/studio/src/components/marketplace/AgentCard.tsx` (if not deleted)

**Files to Delete:**
- `apps/studio/src/components/marketplace/KYABadge.tsx`
- `apps/studio/src/components/marketplace/TrustScore.tsx`
- `apps/studio/src/components/marketplace/RatingStars.tsx`

---

### 1.2 Add Error Boundaries (2 days)

#### Task 1.2.1: Create Error Boundary Component
**Effort:** 0.5 days  
**Assignee:** Frontend Dev 2

**Implementation:**
```typescript
// apps/studio/src/components/shared/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

#### Task 1.2.2: Wrap Major Pages
**Effort:** 1.5 days  
**Assignee:** Frontend Dev 1 & 2

**Pages to Wrap:**
1. Marketplace (`/marketplace`)
2. My Agents (`/my-agents`)
3. Builder (`/builder`)
4. Agent Workspace (`/workspace/[agentId]`)
5. Settings (`/settings`)
6. Fleet (`/fleet`)
7. Analytics (`/analytics`)

**Example:**
```typescript
// apps/studio/src/app/marketplace/page.tsx
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function MarketplacePage() {
  return (
    <ErrorBoundary>
      <MarketplaceContent />
    </ErrorBoundary>
  );
}
```

---

### 1.3 Complete Stripe Integration (3 days)

#### Task 1.3.1: Implement Webhook Handlers
**Effort:** 2 days  
**Assignee:** Frontend Dev 3

**File:** `apps/studio/src/app/api/stripe/webhook/route.ts`

**TODOs to Complete:**
1. Line 43: Grant user access after payment success
2. Line 50: Log failure and notify user
3. Line 58: Update user plan on subscription update
4. Line 65: Downgrade user plan on cancellation

**Implementation:**
```typescript
case 'payment_intent.succeeded':
  const paymentIntent = event.data.object;
  console.log('[Stripe] Payment succeeded:', paymentIntent.id);
  
  // TODO: Grant user access / update credits
  await grantUserAccess({
    userId: paymentIntent.metadata.userId,
    agentId: paymentIntent.metadata.agentId,
    amount: paymentIntent.amount,
  });
  
  // Send success notification
  await sendNotification({
    userId: paymentIntent.metadata.userId,
    type: 'payment_success',
    message: 'Payment processed successfully',
  });
  break;

case 'payment_intent.payment_failed':
  const failedIntent = event.data.object;
  console.log('[Stripe] Payment failed:', failedIntent.id);
  
  // TODO: Log failure / notify user
  await logPaymentFailure({
    userId: failedIntent.metadata.userId,
    reason: failedIntent.last_payment_error?.message,
  });
  
  await sendNotification({
    userId: failedIntent.metadata.userId,
    type: 'payment_failed',
    message: 'Payment failed. Please try again.',
  });
  break;

case 'customer.subscription.updated':
  const subscription = event.data.object;
  console.log('[Stripe] Subscription updated:', subscription.id);
  
  // TODO: Update user plan
  await updateUserPlan({
    userId: subscription.metadata.userId,
    planId: subscription.items.data[0].price.id,
    status: subscription.status,
  });
  break;

case 'customer.subscription.deleted':
  const deletedSub = event.data.object;
  console.log('[Stripe] Subscription cancelled:', deletedSub.id);
  
  // TODO: Downgrade user plan
  await downgradeUserPlan({
    userId: deletedSub.metadata.userId,
    reason: 'subscription_cancelled',
  });
  break;
```

---

#### Task 1.3.2: Add Payment Success/Failure UI
**Effort:** 1 day  
**Assignee:** Frontend Dev 1

**Create:**
- `apps/studio/src/app/payment/success/page.tsx`
- `apps/studio/src/app/payment/failed/page.tsx`

**Implementation:**
```typescript
// apps/studio/src/app/payment/success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');

  useEffect(() => {
    toast.success('Payment successful!');
    
    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push(agentId ? `/agents/${agentId}` : '/my-agents');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, agentId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
      <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-gray-400 mb-6">
        Your agent has been added to your collection.
      </p>
      <p className="text-sm text-gray-500">
        Redirecting to your agents...
      </p>
    </div>
  );
}
```

---

### 1.4 Remove Orphaned Files (2 days)

#### Task 1.4.1: Identify and Remove Dead Code
**Effort:** 1 day  
**Assignee:** Frontend Dev 2

**Files to Investigate:**
1. `apps/studio/src/hooks/page.tsx` - Unexpected page in hooks directory
2. `apps/studio/src/hooks/route.ts` - Unexpected route in hooks directory
3. `apps/studio/src/components/VoiceOrb.tsx` - After consolidation

**Process:**
1. Search for imports of each file
2. If no imports found, mark for deletion
3. Run tests to ensure no breakage
4. Delete files

**Command to find imports:**
```bash
grep -r "from.*VoiceOrb" apps/studio/src --include="*.tsx" --include="*.ts"
```

---

#### Task 1.4.2: Clean Up Deprecated Imports
**Effort:** 1 day  
**Assignee:** Frontend Dev 1

**Files with Deprecated Imports:**
- `apps/studio/src/components/marketplace/TrustScore.tsx`
- `apps/studio/src/components/marketplace/RatingStars.tsx`

**Process:**
1. Update all imports to use new locations
2. Add deprecation warnings
3. Schedule removal for Phase 2

---

## Phase 2: High Priority (Week 3-4)

**Priority:** HIGH  
**Duration:** 10 working days  
**Team:** 3 developers

### 2.1 Complete Skills Module (5 days)

#### Task 2.1.1: Add Edit Skill Functionality
**Effort:** 2 days  
**Assignee:** Frontend Dev 1

**Create:**
- Edit modal component
- Update API integration
- Form validation

**Implementation:**
```typescript
// apps/studio/src/components/skills/EditSkillModal.tsx
'use client';

import { useState } from 'react';
import { Dialog } from '@/components/shared';
import { toast } from 'sonner';

interface EditSkillModalProps {
  skill: Skill;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSkillModal({ skill, isOpen, onClose, onSuccess }: EditSkillModalProps) {
  const [formData, setFormData] = useState(skill);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/skills/${skill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update skill');

      toast.success('Skill updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to update skill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </Dialog>
  );
}
```

**API Endpoint to Create:**
```typescript
// apps/studio/src/app/api/skills/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate input
    // Update skill in database
    // Return updated skill
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    );
  }
}
```

---

#### Task 2.1.2: Add Delete Skill Functionality
**Effort:** 1 day  
**Assignee:** Frontend Dev 2

**Implementation:**
```typescript
// Add to SkillCard component
const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this skill?')) return;

  try {
    const response = await fetch(`/api/skills/${skill.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete skill');

    toast.success('Skill deleted successfully');
    onDelete?.();
  } catch (error) {
    toast.error('Failed to delete skill');
  }
};
```

**API Endpoint:**
```typescript
// apps/studio/src/app/api/skills/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete skill from database
    // Clean up associated resources
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}
```

---

#### Task 2.1.3: Add Skill Testing Interface
**Effort:** 2 days  
**Assignee:** Frontend Dev 3

**Create:**
- Test modal with input/output display
- API integration for testing
- Result visualization

**Implementation:**
```typescript
// apps/studio/src/components/skills/TestSkillModal.tsx
'use client';

import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

export function TestSkillModal({ skill, isOpen, onClose }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/skills/${skill.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter test input..."
          className="w-full h-32 p-4 rounded-lg bg-gray-900 border border-gray-700"
        />
        
        <button
          onClick={handleTest}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Play />}
          Run Test
        </button>

        {output && (
          <pre className="p-4 rounded-lg bg-gray-900 border border-gray-700 overflow-auto">
            {output}
          </pre>
        )}
      </div>
    </Dialog>
  );
}
```

---

### 2.2 Improve Error Handling (3 days)

#### Task 2.2.1: Add Error States to All Pages
**Effort:** 2 days  
**Assignee:** Frontend Dev 1 & 2

**Pattern to Implement:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function PageWithErrorHandling() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/endpoint');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState />;
  
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={fetchData}
      />
    );
  }

  return <Content data={data} />;
}
```

**Pages to Update:**
- Marketplace
- Fleet
- Analytics
- Skills
- MCP
- Plugins

---

#### Task 2.2.2: Implement Toast Notifications
**Effort:** 1 day  
**Assignee:** Frontend Dev 3

**Add to All Actions:**
```typescript
import { toast } from 'sonner';

// Success
toast.success('Agent created successfully');

// Error
toast.error('Failed to create agent');

// Loading
const toastId = toast.loading('Creating agent...');
// Later: toast.dismiss(toastId);

// With action
toast.success('Agent deployed', {
  action: {
    label: 'View',
    onClick: () => router.push(`/agents/${id}`),
  },
});
```

---

### 2.3 Add Loading States (2 days)

#### Task 2.3.1: Create Skeleton Loaders
**Effort:** 1 day  
**Assignee:** Frontend Dev 2

**Create:**
```typescript
// apps/studio/src/components/shared/Skeleton.tsx
export function AgentCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-48 bg-gray-800 rounded-t-xl" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-5/6" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AgentCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

---

#### Task 2.3.2: Add Loading Indicators
**Effort:** 1 day  
**Assignee:** Frontend Dev 1

**Add to:**
- Marketplace grid
- Agent details modal
- Memory tree
- Analytics charts
- Settings forms

**Example:**
```typescript
{loading ? (
  <GridSkeleton count={9} />
) : (
  <AgentGrid agents={agents} />
)}
```

---

## Phase 3: Medium Priority (Week 5-6)

**Priority:** MEDIUM  
**Duration:** 10 working days  
**Team:** 2-3 developers

### 3.1 Enhance Memory Module (4 days)

#### Task 3.1.1: Complete Tree Visualization
**Effort:** 2 days  
**Assignee:** Frontend Dev 1

**Enhance:**
- Add zoom/pan controls
- Implement node expansion/collapse
- Add search highlighting
- Improve performance for large trees

---

#### Task 3.1.2: Add Memory Search
**Effort:** 1 day  
**Assignee:** Frontend Dev 2

**Implementation:**
```typescript
// Add search bar to memory page
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);

const handleSearch = async (query: string) => {
  const response = await fetch(
    `/api/agents/${agentId}/memory/search?q=${query}`
  );
  const results = await response.json();
  setSearchResults(results);
};
```

---

#### Task 3.1.3: Add Memory Analytics
**Effort:** 1 day  
**Assignee:** Frontend Dev 3

**Add:**
- Memory usage statistics
- Growth over time chart
- Most accessed memories
- Memory type distribution

---

### 3.2 Add Form Validation (3 days)

#### Task 3.2.1: Implement React Hook Form
**Effort:** 2 days  
**Assignee:** Frontend Dev 1

**Install:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

**Example:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  role: z.string().min(1, 'Role is required'),
});

export function AgentForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

**Forms to Update:**
- Agent builder
- Skill creation
- Settings forms
- API key creation

---

#### Task 3.2.2: Add Inline Validation
**Effort:** 1 day  
**Assignee:** Frontend Dev 2

**Add real-time validation feedback:**
- Field-level validation
- Inline error messages
- Success indicators
- Validation on blur

---

### 3.3 Improve TypeScript Coverage (3 days)

#### Task 3.3.1: Remove All `any` Types
**Effort:** 2 days  
**Assignee:** Frontend Dev 1 & 2

**Process:**
1. Find all `any` types: `grep -r ": any" apps/studio/src`
2. Replace with proper types
3. Add type definitions where missing

**Example:**
```typescript
// Before
const handleEvent = (event: any) => {
  console.log(event.target.value);
};

// After
const handleEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log(event.target.value);
};
```

---

#### Task 3.3.2: Add Missing Type Definitions
**Effort:** 1 day  
**Assignee:** Frontend Dev 3

**Create:**
- Complete type definitions for all API responses
- Proper event handler types
- Component prop types

---

## Phase 4: Low Priority (Week 7-8)

**Priority:** LOW  
**Duration:** 10 working days  
**Team:** 2 developers

### 4.1 Add E2E Tests (5 days)

#### Task 4.1.1: Setup Playwright
**Effort:** 1 day  
**Assignee:** QA Engineer

**Install:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Configure:**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

---

#### Task 4.1.2: Write Critical Path Tests
**Effort:** 4 days  
**Assignee:** QA Engineer + Frontend Dev

**Tests to Write:**
1. **Agent Creation Flow** (1 day)
   - Navigate to builder
   - Fill form
   - Validate
   - Create agent
   - Verify in my-agents

2. **Marketplace Purchase Flow** (1 day)
   - Browse marketplace
   - View agent details
   - Initiate purchase
   - Complete payment
   - Verify ownership

3. **Deployment Flow** (1 day)
   - Select agent
   - Configure deployment
   - Deploy
   - Verify deployment status

4. **KYC Verification Flow** (1 day)
   - Navigate to identity
   - Connect Pi Network
   - Complete KYC
   - Verify status

---

### 4.2 Performance Optimization (3 days)

#### Task 4.2.1: Implement Code Splitting
**Effort:** 1 day  
**Assignee:** Frontend Dev 1

**Add dynamic imports:**
```typescript
import dynamic from 'next/dynamic';

const VoiceOrb = dynamic(() => import('@/components/studio/VoiceOrb'), {
  loading: () => <VoiceOrbSkeleton />,
  ssr: false,
});

const AnalyticsCharts = dynamic(() => import('@/components/analytics/Charts'), {
  loading: () => <ChartsSkeleton />,
});
```

---

#### Task 4.2.2: Add Memoization
**Effort:** 1 day  
**Assignee:** Frontend Dev 2

**Memoize expensive components:**
```typescript
import { memo } from 'react';

export const AgentCard = memo(function AgentCard({ agent }) {
  // Component logic
}, (prevProps, nextProps) => {
  return prevProps.agent.id === nextProps.agent.id;
});
```

---

#### Task 4.2.3: Optimize Bundle Size
**Effort:** 1 day  
**Assignee:** Frontend Dev 1

**Actions:**
- Analyze bundle with `@next/bundle-analyzer`
- Remove unused dependencies
- Use tree-shaking
- Optimize images

---

### 4.3 Accessibility Improvements (2 days)

#### Task 4.3.1: Add ARIA Labels
**Effort:** 1 day  
**Assignee:** Frontend Dev 2

**Add to all interactive elements:**
```typescript
<button
  aria-label="Create new agent"
  aria-describedby="create-agent-description"
>
  <Plus />
</button>
```

---

#### Task 4.3.2: Improve Keyboard Navigation
**Effort:** 1 day  
**Assignee:** Frontend Dev 1

**Ensure:**
- All interactive elements are keyboard accessible
- Proper focus management
- Skip links for navigation
- Focus indicators visible

---

## Dead Code Removal Tasks

### Files to Delete

**After Phase 1:**
- ✅ `apps/studio/src/components/VoiceOrb.tsx`
- ✅ `apps/studio/src/components/marketplace/AgentCard.tsx`
- ✅ `apps/studio/src/components/marketplace/KYABadge.tsx`
- ✅ `apps/studio/src/components/marketplace/TrustScore.tsx`
- ✅ `apps/studio/src/components/marketplace/RatingStars.tsx`
- ✅ `apps/studio/src/components/studio/AgentCard.tsx`
- ✅ `apps/studio/src/hooks/page.tsx` (if orphaned)
- ✅ `apps/studio/src/hooks/route.ts` (if orphaned)

### Unused Imports to Remove

**Search and remove:**
```bash
# Find unused imports
npx eslint apps/studio/src --ext .ts,.tsx --rule 'no-unused-vars: error'

# Or use
npx ts-prune
```

---

## Consolidation Strategy

### Component Consolidation

**Priority 1: AgentCard**
- Source: 3 implementations
- Target: `components/agents/AgentCard/`
- Strategy: Context-based rendering

**Priority 2: VoiceOrb**
- Source: 2 implementations
- Target: `components/studio/VoiceOrb.tsx`
- Strategy: Feature flags

**Priority 3: Badges**
- Source: Multiple badge components
- Target: Unified badge system
- Strategy: Variant-based props

### State Management Consolidation

**Current:** Mixed patterns (useState, Context, custom hooks)
**Target:** Consistent pattern using custom hooks

**Example:**
```typescript
// Consolidate agent state
useLocalAgents() // For local operations
useMarketplace() // For marketplace operations
useRegistry()    // For registry operations
```

---

## Missing Features Roadmap

### Skills Module (Phase 2)
- ✅ Edit skill
- ✅ Delete skill
- ✅ Test skill
- ⏳ Marketplace integration (Phase 3)

### Plugins Module (Phase 3)
- ⏳ List plugins
- ⏳ Create plugin
- ⏳ Plugin details
- ⏳ Install/uninstall

### Lists & Kits (Phase 4)
- ⏳ Create list
- ⏳ Manage list items
- ⏳ Create kit
- ⏳ Kit marketplace

### Memory Module (Phase 3)
- ✅ Search functionality
- ✅ Analytics
- ⏳ Export/import
- ⏳ Sharing

---

## Code Quality Improvements

### TypeScript Improvements

**Metrics:**
- Current: 78% type coverage
- Target: 95% type coverage

**Actions:**
1. Remove all `any` types
2. Add proper type definitions
3. Enable strict mode
4. Add type tests

### Code Style Consistency

**Install:**
```bash
npm install -D prettier eslint-config-prettier
```

**Configure:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Documentation

**Add JSDoc comments to:**
- All public functions
- Complex components
- Custom hooks
- Utility functions

**Example:**
```typescript
/**
 * Creates a new agent with the provided configuration
 * @param config - Agent configuration object
 * @returns Promise resolving to created agent
 * @throws {ValidationError} If config is invalid
 */
export async function createAgent(config: AgentConfig): Promise<Agent> {
  // Implementation
}
```

---

## Test Coverage Expansion

### Current Coverage
- Unit Tests: 20%
- Integration Tests: 10%
- E2E Tests: 5%

### Target Coverage
- Unit Tests: 70%
- Integration Tests: 50%
- E2E Tests: 40%

### Testing Strategy

**Unit Tests (Phase 3-4):**
- All custom hooks
- Utility functions
- Complex components

**Integration Tests (Phase 4):**
- API route handlers
- Form submissions
- State management

**E2E Tests (Phase 4):**
- Critical user flows
- Payment flows
- Deployment flows

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ Zero duplicate components
- ✅ Error boundaries on all major pages
- ✅ Stripe integration complete
- ✅ All orphaned files removed

### Phase 2 Success Criteria
- ✅ Skills module 100% complete
- ✅ Error handling on all pages
- ✅ Loading states everywhere
- ✅ Toast notifications implemented

### Phase 3 Success Criteria
- ✅ Memory module enhanced
- ✅ All forms validated
- ✅ TypeScript coverage > 90%
- ✅ No `any` types remaining

### Phase 4 Success Criteria
- ✅ E2E test coverage > 40%
- ✅ Bundle size reduced 30%
- ✅ Accessibility score > 90
- ✅ Performance score > 85

---

## Risk Mitigation

### High Risk Items

**1. Component Migration**
- Risk: Breaking existing functionality
- Mitigation: Thorough testing, gradual rollout

**2. API Changes**
- Risk: Frontend-backend misalignment
- Mitigation: API versioning, contract testing

**3. Performance Regression**
- Risk: New features slow down app
- Mitigation: Performance monitoring, benchmarks

### Rollback Plan

**If issues arise:**
1. Revert to previous commit
2. Fix issues in separate branch
3. Re-test thoroughly
4. Deploy fix

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | Week 1-2 | Consolidation, error boundaries, Stripe |
| Phase 2 | Week 3-4 | Skills module, error handling, loading states |
| Phase 3 | Week 5-6 | Memory enhancements, validation, TypeScript |
| Phase 4 | Week 7-8 | E2E tests, performance, accessibility |

**Total Duration:** 8 weeks  
**Total Effort:** ~320 developer-hours

---

## Approval & Sign-off

**Prepared by:** Bob (AI Code Auditor)  
**Date:** 2026-05-02  
**Status:** Ready for Review

**Approvals Required:**
- [ ] Frontend Lead
- [ ] Technical Architect
- [ ] Product Manager
- [ ] QA Lead

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-02  
**Next Review:** After Phase 1 completion