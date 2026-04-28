# AIX Production Rollback Protocol

## Cloud Deployment (Vercel)

If the `studio` app deployment fails or exhibits visual bugs post-merge:
1. **Immediate Reversion**: Navigate to the Vercel Dashboard -> Deployments. Find the previous stable build and click **"Promote to Production"**.
2. **Locking Branch**: Place a freeze on the `main` branch to halt automated agent submissions.

## Repository Data & Code Reversion (GitHub)

1. Wait for GitHub Unhandled 500 pages to clear if experiencing platform outages.
2. Use the standard git revert command to cleanly invert the broken commit without corrupting history.
3. Allow the `verify-build.cjs` and `playwright` visual regression CI pipelines to confirm the reverted codebase is strictly sound.
4. Unfreeze the branch.
