jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      appEnv: "test",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "test-anon-key",
    },
  },
}));
