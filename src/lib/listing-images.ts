import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";

export const MAX_IMAGES = 8;
const LISTING_PICKER_CACHE_DIR = `${FileSystem.cacheDirectory}listing-wizard-images/`;

function getFileExt(uri: string): string {
  const rawExt = uri.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
  return rawExt === "jpg" ? "jpeg" : rawExt;
}

async function persistPickedUri(uri: string, index: number): Promise<string> {
  if (!uri || uri.startsWith("http")) return uri;

  try {
    await FileSystem.makeDirectoryAsync(LISTING_PICKER_CACHE_DIR, { intermediates: true });
    const ext = getFileExt(uri);
    const safeName = `${Date.now()}-${index}.${ext}`;
    const destination = `${LISTING_PICKER_CACHE_DIR}${safeName}`;
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  } catch {
    // If copy fails, keep original URI; upload step will validate existence.
    return uri;
  }
}

export async function pickListingImages(): Promise<string[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Se necesita permiso para acceder a la galeria.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsMultipleSelection: true,
    quality: 0.85,
    selectionLimit: MAX_IMAGES,
  });

  if (result.canceled) return [];
  return Promise.all(result.assets.map((a, idx) => persistPickedUri(a.uri, idx)));
}

export async function uploadListingImage(
  userId: string,
  folder: string,
  uri: string,
  index: number,
): Promise<string> {
  const ext = getFileExt(uri);
  const path = `${userId}/${folder}/${index}.${ext}`;

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    throw new Error(
      "No encontramos una de las fotos seleccionadas. Vuelve a seleccionarla antes de publicar.",
    );
  }

  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
  } catch (error) {
    const msg = (error as Error).message ?? "";
    if (msg.includes("ENOENT") || msg.includes("FileNotFoundException")) {
      throw new Error(
        "Una foto temporal ya no esta disponible. Vuelve a abrir el selector y anadela de nuevo.",
      );
    }
    throw error;
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const { error } = await supabase.storage.from("listing-images").upload(path, bytes, {
    contentType: `image/${ext}`,
    upsert: true,
  });

  if (error) throw error;

  // Try resize (non-blocking if edge function is not deployed).
  try {
    await supabase.functions.invoke("resize-listing-image", { body: { path } });
  } catch {
    // silent
  }

  const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAllListingImages(
  userId: string,
  folder: string,
  uris: string[],
): Promise<string[]> {
  return Promise.all(uris.map((uri, i) => uploadListingImage(userId, folder, uri, i)));
}

export async function deleteListingImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from("listing-images").remove([path]);
  if (error) throw error;
}
