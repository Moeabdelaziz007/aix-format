import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Fingerprint, KeyRound, Check, Loader2 } from "lucide-react";
import { useIdentityStore } from "@/store/identity";
import { useSignalStore } from "@/store/signals";
import { sha256Hex, shortHash } from "@/lib/aix/hash";
import { cn } from "@/lib/utils";

interface KycSignatureModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  { id: 0, title: "Pi KYC", icon: ShieldCheck, desc: "تحقق من الهوية عبر شبكة Pi" },
  { id: 1, title: "did:axiom", icon: Fingerprint, desc: "توليد معرّف ذاتي السيادة" },
  { id: 2, title: "Sign", icon: KeyRound, desc: "توقيع التزام بمفتاحك الخاص" },
];

export function KycSignatureModal({ open, onClose }: KycSignatureModalProps) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const setDid = useIdentityStore((s) => s.setDid);
  const setKyc = useIdentityStore((s) => s.setKyc);
  const did = useIdentityStore((s) => s.did);
  const jws = useIdentityStore((s) => s.jws);
  const pushSignal = useSignalStore((s) => s.push);

  const next = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    if (step === 0) {
      setKyc("pending");
      pushSignal({ kind: "info", source: "kyc", message: "بدأ تحقق Pi KYC" });
      setStep(1);
    } else if (step === 1) {
      const seed = crypto.randomUUID();
      const hash = await sha256Hex(seed);
      const newDid = `did:axiom:${hash.slice(0, 14)}`;
      setDid(newDid);
      pushSignal({ kind: "success", source: "identity", message: `صدر ${newDid}` });
      setStep(2);
    } else {
      const payload = JSON.stringify({ did, ts: Date.now() });
      const sig = await sha256Hex(payload + "::sovereign-key");
      const fakeJws = `eyJhbGciOiJFZERTQSJ9.${btoa(payload).slice(0, 24)}.${sig.slice(0, 32)}`;
      setKyc("verified", fakeJws);
      pushSignal({ kind: "signature", source: "kyc", message: "تم التوقيع بنجاح", payload: { jws: shortHash(fakeJws, 14, 10) } });
      setDone(true);
    }
    setBusy(false);
  };

  const reset = () => {
    setStep(0);
    setDone(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0.05 0.02 260 / 0.6)", backdropFilter: "blur(12px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="glass-strong relative w-full max-w-lg overflow-hidden rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* progress bar */}
            <div className="h-0.5 bg-white/5">
              <motion.div
                className="h-full"
                style={{
                  background: "linear-gradient(90deg, oklch(0.85 0.08 240), oklch(0.92 0.04 220))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${((done ? 3 : step) / 3) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="p-7">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Sovereign Identity
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                    بوابة الهوية السيادية
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Stepper */}
              <div className="mt-6 flex items-center justify-between">
                {steps.map((s, i) => {
                  const Icon = s.icon;
                  const reached = (done ? 3 : step) >= i;
                  const current = !done && step === i;
                  return (
                    <div key={s.id} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                          reached
                            ? "border-azure/40 bg-azure/15 text-azure"
                            : "border-white/10 bg-white/[0.02] text-muted-foreground",
                          current && "ring-2 ring-azure/30",
                        )}
                      >
                        {reached && !current ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" strokeWidth={1.5} />
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-foreground/70">{s.title}</span>
                    </div>
                  );
                })}
              </div>

              {/* Body */}
              <div className="mt-6 min-h-[140px] rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                {!done ? (
                  <div>
                    <h3 className="text-base font-medium text-foreground">{steps[step].title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{steps[step].desc}</p>

                    {step === 1 && did && (
                      <div className="mt-4 rounded-lg bg-black/30 p-3 font-mono text-xs text-azure">
                        {did}
                      </div>
                    )}
                    {step === 2 && (
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="text-muted-foreground">سيتم توقيع:</div>
                        <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 font-mono text-foreground/80">
{`{
  "did": "${did}",
  "intent": "studio.session",
  "ts": ${Date.now()}
}`}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-online/15 text-status-online">
                      <Check className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-medium text-foreground">تم التوقيع بنجاح</h3>
                    {jws && (
                      <code className="break-all rounded-lg bg-black/30 p-2 font-mono text-[10px] text-azure">
                        {shortHash(jws, 18, 12)}
                      </code>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between gap-3">
                {!done ? (
                  <>
                    <button
                      onClick={onClose}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-foreground/80 transition-colors hover:bg-white/[0.06]"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={next}
                      disabled={busy}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium text-primary-foreground transition-all",
                        "disabled:opacity-50",
                      )}
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.92 0.03 230), oklch(0.78 0.06 240))",
                        boxShadow: "0 8px 24px oklch(0.7 0.08 240 / 0.25)",
                      }}
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      {step === 2 ? "توقيع" : "متابعة"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      reset();
                      onClose();
                    }}
                    className="ml-auto rounded-xl border border-white/10 bg-white/[0.05] px-5 py-2 text-sm text-foreground transition-colors hover:bg-white/[0.08]"
                  >
                    إغلاق
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
