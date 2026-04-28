import { create } from "zustand";

export type KycStatus = "idle" | "pending" | "verified" | "failed";

interface IdentityStore {
  did: string | null;
  kycStatus: KycStatus;
  jws: string | null;
  setDid: (did: string) => void;
  setKyc: (status: KycStatus, jws?: string) => void;
  reset: () => void;
}

export const useIdentityStore = create<IdentityStore>((set) => ({
  did: null,
  kycStatus: "idle",
  jws: null,
  setDid: (did) => set({ did }),
  setKyc: (kycStatus, jws) => set({ kycStatus, jws: jws ?? null }),
  reset: () => set({ did: null, kycStatus: "idle", jws: null }),
}));
