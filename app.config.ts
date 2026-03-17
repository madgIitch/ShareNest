import type { ExpoConfig } from "expo/config";

const appEnv = process.env.APP_ENV ?? "dev";

const config: ExpoConfig = {
  name: "ShareNest",
  slug: "sharenest",
  scheme: "sharenest",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#2952C4",
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundColor: "#2952C4",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-router",
      {
        origin: "https://sharenest.app",
      },
    ],
    "expo-secure-store",
    "expo-font",
  ],
  extra: {
    appEnv,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
};

export default config;
