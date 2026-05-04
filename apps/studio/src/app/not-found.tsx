import Link from 'next/link';
import * as motion from 'framer-motion/client';
import { SovereignAetherClient } from '@/components/studio/SovereignAetherClient';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center overflow-hidden relative">
      <SovereignAetherClient />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 px-6"
      >
        {/* Giant glitchy 404 */}
        <h1 className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text text-gradient opacity-20 select-none glitch-text">
          404
        </h1>
        <p className="text-2xl font-bold text-white -mt-10 md:-mt-16">Agent Not Found</p>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          The sovereign path you&apos;re looking for does not exist in the registry or has been archived.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link href="/" className="btn btn-primary">
            ← Return to Studio
          </Link>
          <Link href="/marketplace" className="btn btn-ghost">
            Browse Agents
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
