import { create } from "zustand";

interface FiltersState {
  city_id: string | null;
  place_id: string | null;
  price_min: number | null;
  price_max: number | null;
  allows_pets: boolean | null;
  allows_smoking: boolean | null;
  available_from: string | null;
  setFilter: <K extends keyof Omit<FiltersState, "setFilter" | "resetFilters">>(
    key: K,
    value: FiltersState[K]
  ) => void;
  resetFilters: () => void;
}

const initialFilters = {
  city_id: null,
  place_id: null,
  price_min: null,
  price_max: null,
  allows_pets: null,
  allows_smoking: null,
  available_from: null,
};

export const useFiltersStore = create<FiltersState>((set) => ({
  ...initialFilters,
  setFilter: (key, value) => set({ [key]: value }),
  resetFilters: () => set(initialFilters),
}));
