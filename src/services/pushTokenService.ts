// src/services/pushTokenService.ts
// expo-notifications se importa de forma lazy (require) para evitar que
// DevicePushTokenAutoRegistration se ejecute al cargar el módulo en Expo Go (SDK 53+).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

import { supabase } from "../lib/supabase";

const isExpoGo = Constants.executionEnvironment === "storeClient";

const getNotifications = () => {
  if (isExpoGo) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("expo-notifications") as typeof import("expo-notifications");
};

const PUSH_TOKEN_KEY = "sharenest_push_token";
const PLATFORM: "ios" | "android" = Platform.OS === "ios" ? "ios" : "android";

type RegisterResult =
  | { status: "registered"; token: string }
  | { status: "denied" }
  | { status: "error"; error: unknown };

async function upsertToken(userId: string, token: string) {
  const { error } = await supabase.from("push_tokens").upsert(
    { user_id: userId, token, platform: PLATFORM },
    { onConflict: "user_id,token" },
  );
  if (error) throw error;
}

async function deleteToken(userId: string, token: string) {
  const { error } = await supabase
    .from("push_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("token", token);
  if (error) throw error;
}

export const pushTokenService = {
  async register(userId: string): Promise<RegisterResult> {
    try {
      if (isExpoGo || !Device.isDevice) return { status: "denied" };

      const Notifications = getNotifications();
      if (!Notifications) return { status: "denied" };

      const perm = await Notifications.getPermissionsAsync();
      let finalStatus = perm.status;
      if (finalStatus !== "granted") {
        const req = await Notifications.requestPermissionsAsync();
        finalStatus = req.status;
      }
      if (finalStatus !== "granted") return { status: "denied" };

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("messages", {
          name: "Mensajes",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      // getExpoPushTokenAsync → Expo Push API token
      let tokenObj: { data: string } | null = null;
      try {
        tokenObj = await Notifications.getExpoPushTokenAsync();
      } catch {
        return { status: "denied" };
      }

      const token = tokenObj?.data ?? "";
      if (!token) return { status: "error", error: new Error("Empty push token") };

      await upsertToken(userId, token);
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

      return { status: "registered", token };
    } catch (error) {
      console.log("[pushTokenService.register] error:", error);
      return { status: "error", error };
    }
  },

  onTokenRefresh(userId: string): () => void {
    try {
      const Notifications = getNotifications();
      if (!Notifications) return () => {};
      const sub = Notifications.addPushTokenListener(async (event) => {
        try {
          const token = typeof event?.data === "string" ? event.data : String(event?.data ?? "");
          if (!token) return;
          await upsertToken(userId, token);
          await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
        } catch (err) {
          console.log("[pushTokenService.onTokenRefresh] error:", err);
        }
      });
      return () => sub.remove();
    } catch {
      // Not supported in Expo Go
      return () => {};
    }
  },

  async unregister(userId: string): Promise<void> {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;
    try {
      await deleteToken(userId, token);
    } catch (err) {
      console.log("[pushTokenService.unregister] error:", err);
    } finally {
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    }
  },
};
