import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "../src/lib/queryClient";
import { useAuth } from "../src/hooks/useAuth";
import { useAuthStore } from "../src/stores/authStore";

function AuthRedirect() {
  useAuth();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [user, loading]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthRedirect />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="listing/[id]" />
            <Stack.Screen name="seeker/[id]" />
            <Stack.Screen name="household/index" />
            <Stack.Screen name="household/expenses" />
            <Stack.Screen name="household/[id]/index" />
            <Stack.Screen name="user/[id]" />
            <Stack.Screen name="publish" />
            <Stack.Screen name="conversation/[id]" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
