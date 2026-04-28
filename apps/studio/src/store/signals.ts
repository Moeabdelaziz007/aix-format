import { create } from "zustand";

export type SignalKind = "info" | "success" | "warn" | "error" | "signature";

export interface Signal {
  id: string;
  ts: string;
  kind: SignalKind;
  source: string;
  message: string;
  payload?: unknown;
}

interface SignalStore {
  signals: Signal[];
  push: (s: Omit<Signal, "id" | "ts">) => void;
  clear: () => void;
}

const MAX = 200;

export const useSignalStore = create<SignalStore>((set) => ({
  signals: [],
  push: (s) =>
    set((state) => ({
      signals: [
        { ...s, id: crypto.randomUUID(), ts: new Date().toISOString() },
        ...state.signals,
      ].slice(0, MAX),
    })),
  clear: () => set({ signals: [] }),
}));
