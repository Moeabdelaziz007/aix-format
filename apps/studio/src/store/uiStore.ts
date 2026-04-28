import { create } from 'zustand';

type VoiceOrbState = 'idle' | 'listening' | 'processing' | 'speaking';

interface UIState {
  voiceOrbState: VoiceOrbState;
  setVoiceOrbState: (state: VoiceOrbState) => void;
  isKycModalOpen: boolean;
  openKycModal: () => void;
  closeKycModal: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  voiceOrbState: 'idle',
  setVoiceOrbState: (state) => set({ voiceOrbState: state }),
  isKycModalOpen: false,
  openKycModal: () => set({ isKycModalOpen: true }),
  closeKycModal: () => set({ isKycModalOpen: false }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
