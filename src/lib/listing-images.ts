import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";

export const MAX_IMAGES = 8;

export async function pickListingImages(): Promise<string[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Se necesita permiso para acceder a la galería.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsMultipleSelection: true,
    quality: 0.85,
    selectionLimit: MAX_IMAGES,
  });

  if (result.canceled) return [];
  return result.assets.map((a) => a.uri);
}

export async function uploadListingImage(
  userId: string,
  folder: string,
  uri: string,
  index: number,
): Promise<string> {
  const rawExt = uri.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
  const ext = rawExt === "jpg" ? "jpeg" : rawExt;
  const path = `${userId}/${folder}/${index}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
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

  // Intentar resize (no bloqueante si la edge function no está deployada)
  try {
    await supabase.functions.invoke("resize-listing-image", { body: { path } });
  } catch {
    // silencioso
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
