import { create } from "zustand";

type AppState = {
  hasSeenIntro: boolean;
  setHasSeenIntro: (value: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  hasSeenIntro: false,
  setHasSeenIntro: (value: boolean) => set({ hasSeenIntro: value }),
}));
