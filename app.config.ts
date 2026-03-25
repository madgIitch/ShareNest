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
    package: "com.sharenest.app",
    adaptiveIcon: {
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundColor: "#2952C4",
    },
    predictiveBackGestureEnabled: false,
    googleServicesFile: "./google-services.json",
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
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#10b981",
        sounds: [],
      },
    ],
    "expo-web-browser",
    "@maplibre/maplibre-react-native",
    // "expo-updates", // uncomment after: npx expo install expo-updates
  ],
  updates: {
    url: "https://u.expo.dev/YOUR_EAS_PROJECT_ID",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  extra: {
    appEnv,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    eas: {
      projectId: "YOUR_EAS_PROJECT_ID",
    },
  },
};

export default config;
