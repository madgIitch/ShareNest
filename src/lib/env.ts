import Constants from "expo-constants";

type AppEnv = "dev" | "staging" | "prod" | "test";

type ExtraConfig = {
  appEnv?: AppEnv;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

function requireConfig(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing Expo extra config key: ${key}`);
  }
  return value;
}

export const env = {
  appEnv: extra.appEnv ?? "dev",
  supabaseUrl: requireConfig(extra.supabaseUrl, "supabaseUrl"),
  supabaseAnonKey: requireConfig(extra.supabaseAnonKey, "supabaseAnonKey"),
};
