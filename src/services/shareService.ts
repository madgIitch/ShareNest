// src/services/shareService.ts
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "../lib/supabase";

const SUPABASE_FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    // eslint-disable-next-line no-bitwise
    out += chars[b1 >> 2];
    // eslint-disable-next-line no-bitwise
    out += chars[((b1 & 3) << 4) | (b2 >> 4)];
    // eslint-disable-next-line no-bitwise
    out += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    // eslint-disable-next-line no-bitwise
    out += i + 2 < bytes.length ? chars[b3 & 63] : "=";
  }
  return out;
}

class ShareService {
  private async fetchImage(url: URL, label: string): Promise<ArrayBuffer> {
    // listing-share-image is public (no JWT), but include anon key for other functions
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
    let headers: Record<string, string> = { apikey: anonKey };

    // Also send the user session token if available
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers = { ...headers, Authorization: `Bearer ${data.session.access_token}` };
    }

    console.log(`[shareService] fetching ${label}`, url.toString());
    let res = await fetch(url.toString(), { method: "GET", headers });

    // On 401, refresh and retry once
    if (res.status === 401) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        headers = { ...headers, Authorization: `Bearer ${refreshed.session.access_token}` };
        res = await fetch(url.toString(), { method: "GET", headers });
      }
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`[shareService] ${label} error ${res.status}: ${body}`);
    }

    return res.arrayBuffer();
  }

  private async writeFile(buffer: ArrayBuffer, prefix: string): Promise<string> {
    const base64 = arrayBufferToBase64(buffer);
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) throw new Error("No cache directory");

    const dir = `${cacheDir}ShareNest/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

    const path = `${dir}${prefix}-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(path, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("[shareService] saved:", path);
    return path;
  }

  async getListingShareImageFile(listingId: string): Promise<string> {
    const url = new URL(`${SUPABASE_FUNCTIONS_URL}/listing-share-image`);
    url.searchParams.set("listing_id", listingId);
    const buffer = await this.fetchImage(url, "listing");
    return this.writeFile(buffer, "listing-share");
  }
}

export const shareService = new ShareService();
