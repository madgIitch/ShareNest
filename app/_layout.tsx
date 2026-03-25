import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "../src/lib/queryClient";
import { useAuth } from "../src/hooks/useAuth";
import { useAuthStore } from "../src/stores/authStore";
import { isProfileComplete, useProfile } from "../src/hooks/useProfile";

function AuthRedirect() {
  useAuth();
  const { user, loading } = useAuthStore();
  const segments = useSegments();
  const { profile, isLoading: loadingProfile } = useProfile(user?.id);

  useEffect(() => {
    if (loading || (user && loadingProfile)) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const nextRoute = !user
      ? "/(auth)"
      : isProfileComplete(profile)
        ? "/(tabs)"
        : "/(auth)/onboarding";

    const authChild = segments.slice(1)[0] ?? null;
    const alreadyThere =
      (nextRoute === "/(auth)" && inAuthGroup) ||
      (nextRoute === "/(tabs)" && segments[0] === "(tabs)") ||
      (nextRoute === "/(auth)/onboarding" &&
        segments[0] === "(auth)" &&
        authChild === "onboarding");

    if (!alreadyThere) {
      router.replace(nextRoute);
    }
  }, [loading, loadingProfile, profile, segments, user]);

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
