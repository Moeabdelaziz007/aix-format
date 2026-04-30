# Routing Health & Inventory (v1.3.0)

## Route Inventory

| Route | Type | Data Source | HTTP Status |
| :--- | :--- | :--- | :--- |
| `/` | Dashboard | Upstash | 200 |
| `/builder` | Editor | Client | 200 |
| `/my-agents` | List | Upstash Registry | 200 |
| `/analytics` | Metrics | Upstash Stream | 200 |
| `/settings` | Config | Local/Pi SDK | 200 |
| `.well-known/agent.aix.json` | API | Registry | 200 (JSON) |

## Test Matrix

| Path | SSR | Hydration | Skeleton | Error Boundary |
| :--- | :--- | :--- | :--- | :--- |
| `/builder` | No | Strict | Yes | Yes |
| `/my-agents` | Partial | Strict | Yes | Yes |
| `/analytics` | Yes | Strict | Yes | Yes |

## Playwright Verification Spec

Use the following pattern to verify routing health:

```typescript
test('Route /my-agents should render skeletons then data', async ({ page }) => {
  await page.goto('/my-agents');
  await expect(page.locator('[data-testid="skeleton"]')).toBeVisible();
  await expect(page.locator('[data-testid="agent-card"]')).toBeVisible();
});
```
