'use client';

import dynamic from 'next/dynamic';

const SovereignAether = dynamic(
  () => import('@/components/studio/SovereignAether').then(mod => mod.SovereignAether),
  { ssr: false, loading: () => null }
);

export function SovereignAetherClient() {
  return <SovereignAether />;
}
