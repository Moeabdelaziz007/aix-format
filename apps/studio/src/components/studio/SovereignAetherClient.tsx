'use client';

/**
 * SovereignAetherClient — Client Component wrapper.
 * Uses dynamic import with ssr:false (only allowed in Client Components).
 * Fixes Turbopack build error: `ssr: false` is not allowed in Server Components.
 */
import dynamic from 'next/dynamic';

const SovereignAether = dynamic(
  () => import('@/components/studio/SovereignAether').then(mod => mod.SovereignAether),
  { ssr: false, loading: () => null }
);

export function SovereignAetherClient() {
  return <SovereignAether />;
}
