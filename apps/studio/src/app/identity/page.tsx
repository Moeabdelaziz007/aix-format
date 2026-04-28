"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/aix/GlassPanel";
import { KycSignatureModal } from "@/components/aix/KycSignatureModal";
import { useIdentityStore } from "@/store/identity";
import { Fingerprint, ShieldCheck, KeyRound, BadgeCheck, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function IdentityPage() {
  const [open, setOpen] = useState(false);
  const { did, kycStatus, jws, reset } = useIdentityStore();
  const verified = kycStatus === "verified";

  return (
    <div className="mx-auto h-full max-w-3xl overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">الهوية السيادية</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أنشئ معرّف <code className="text-azure">did:axiom</code> ووقّع التزاماتك عبر Pi KYC.
        </p>
      </div>

      <GlassPanel className="overflow-hidden p-0">
        <div
          className="relative px-8 py-10 text-center"
          style={{
            background:
              "radial-gradient(ellipse at top, oklch(0.85 0.08 240 / 0.12), transparent 70%)",
          }}
        >
          <div
            className={cn(
              "mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border",
              verified
                ? "border-status-online/30 bg-status-online/10 text-status-online"
                : "border-white/10 bg-white/[0.05] text-foreground/70",
            )}
          >
            {verified ? <BadgeCheck className="h-9 w-9" strokeWidth={1.5} /> : <Fingerprint className="h-9 w-9" strokeWidth={1.5} />}
          </div>
          <h2 className="mt-5 text-xl font-medium text-foreground">
            {verified ? "هويتك موثّقة" : "لم تُنشَأ هوية بعد"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {verified
              ? "يمكنك الآن توقيع وكلاء AIX باسمك السيادي."
              : "ابدأ تدفّق الثلاث خطوات لتوليد هوية فريدة."}
          </p>

          {did && (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-sm text-azure">
              <Fingerprint className="h-3.5 w-3.5" />
              {did}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-primary-foreground"
              style={{
                background: "linear-gradient(135deg, oklch(0.92 0.03 230), oklch(0.78 0.06 240))",
                boxShadow: "0 8px 24px oklch(0.7 0.08 240 / 0.25)",
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              {verified ? "توقيع جديد" : "بدء التحقق"}
            </button>
            {verified && (
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-white/[0.06]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                إعادة تعيين
              </button>
            )}
          </div>
        </div>

        {jws && (
          <div className="border-t border-white/5 px-6 py-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <KeyRound className="h-3 w-3" />
              JWS Signature
            </div>
            <code className="mt-2 block break-all rounded-lg bg-black/30 p-3 font-mono text-[11px] text-foreground/80">
              {jws}
            </code>
          </div>
        )}
      </GlassPanel>

      <KycSignatureModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
