import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_LISTINGS_KEY = "saved_listings_v1";

export async function getSavedListingIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_LISTINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export async function setSavedListingIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export async function toggleSavedListing(id: string): Promise<{ saved: boolean; ids: string[] }> {
  const current = await getSavedListingIds();
  const exists = current.includes(id);
  const next = exists ? current.filter((x) => x !== id) : [...current, id];
  await setSavedListingIds(next);
  return { saved: !exists, ids: next };
}

