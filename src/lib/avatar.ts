import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";

export async function pickAvatar(): Promise<ImagePicker.ImagePickerAsset | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Se necesita permiso para acceder a la galería.");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0];
}

export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  // Extraer extensión limpia (sin query params)
  const rawExt = uri.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
  const ext = rawExt === "jpg" ? "jpeg" : rawExt;
  const path = `${userId}/avatar.${ext}`;
  const contentType = `image/${ext}`;

  // Leer el archivo como base64 y convertir a Uint8Array
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const { error } = await supabase.storage.from("avatars").upload(path, bytes, {
    contentType,
    upsert: true,
  });

  if (error) throw error;

  return path;
}

export async function uploadProfilePhoto(userId: string, uri: string): Promise<string> {
  const rawExt = uri.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
  const ext = rawExt === "jpg" ? "jpeg" : rawExt;
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${userId}/gallery/${filename}`;
  const contentType = `image/${ext}`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const { error } = await supabase.storage.from("avatars").upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function resizeAvatar(userId: string, path: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("resize-avatar", {
      body: { userId, path },
    });

    if (!error && (data as { thumbUrl?: string })?.thumbUrl) {
      return (data as { thumbUrl: string }).thumbUrl;
    }
  } catch {
    // Edge function no disponible — usar el original
  }

  // Fallback: URL pública del original
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export function getAvatarUrl(userId: string, variant: "avatar" | "thumb" = "avatar"): string {
  const filename = variant === "thumb" ? "thumb.jpg" : "avatar.jpeg";
  const { data } = supabase.storage.from("avatars").getPublicUrl(`${userId}/${filename}`);
  return data.publicUrl;
}
