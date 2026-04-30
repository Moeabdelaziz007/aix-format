import Link from "next/link";
import dynamic from "next/dynamic";

const VoiceOrb = dynamic(
  () => import("@/components/studio/VoiceOrb").then(mod => mod.VoiceOrb),
  { ssr: false, loading: () => <div className="w-full h-64 animate-pulse bg-white/5 rounded-3xl" /> }
);

export function HeroSection() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8">
      <div className="flex flex-col gap-4 text-center md:text-left glass-panel-heavy rounded-3xl p-6 md:p-8 border border-white/5">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text text-gradient tracking-tight">
          Sovereign Pi Agents
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl font-light">
          Build, deploy, and monetize autonomous AI agents via the AIX format and Pi Network KYC.
        </p>
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
          <a
            className="rounded-full border border-solid border-[var(--color-primary-dim)]/70 transition-colors flex items-center justify-center bg-[var(--color-primary)] text-black gap-2 hover:brightness-110 text-sm sm:text-base h-12 px-8 shadow-[0_0_22px_rgba(57,255,20,0.45)]"
            href="https://axiomid.app"
          >
            Deploy New Agent
          </a>
          <Link
            href="/spec"
            className="rounded-full border border-solid border-[var(--color-glass-border)] transition-colors flex items-center justify-center bg-[rgba(20,20,20,0.5)] hover:bg-[rgba(35,35,35,0.82)] text-white text-sm sm:text-base h-12 px-8 sm:px-6 backdrop-blur-xl"
          >
            Read AIX Spec
          </Link>
        </div>
      </div>

      <div className="w-full md:w-1/3 flex justify-center">
        <VoiceOrb />
      </div>
    </div>
  );
}
