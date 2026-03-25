import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_FILTERS } from "../types/filters";
import type { ListingFilters } from "../types/filters";

const KEY = "sharenest_preferred_filters";

export async function saveFilters(filters: ListingFilters): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(filters));
}

export async function loadFilters(): Promise<ListingFilters> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FILTERS;
  }
}
