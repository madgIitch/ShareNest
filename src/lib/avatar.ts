import * as ImagePicker from "expo-image-picker";

import { supabase } from "./supabase";
import { env } from "./env";

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
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from("avatars").upload(path, blob, {
    contentType: `image/${ext}`,
    upsert: true,
  });

  if (error) throw error;

  return path;
}

export async function resizeAvatar(userId: string, path: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("resize-avatar", {
    body: { userId, path },
  });

  if (error) throw error;

  return (data as { thumbUrl: string }).thumbUrl;
}

export function getAvatarUrl(userId: string, variant: "avatar" | "thumb" = "avatar"): string {
  const ext = variant === "thumb" ? "thumb.jpg" : "avatar.jpg";
  const { data } = supabase.storage.from("avatars").getPublicUrl(`${userId}/${ext}`);
  return data.publicUrl;
}
