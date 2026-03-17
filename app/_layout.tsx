import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../src/providers/AuthProvider";
import { QueryProvider } from "../src/providers/QueryProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerTitleAlign: "center",
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ title: "Acceso" }} />
              <Stack.Screen name="verify-phone" options={{ title: "Verificar móvil" }} />
              <Stack.Screen name="onboarding" options={{ title: "Bienvenido/a" }} />
              <Stack.Screen name="home" options={{ title: "ShareNest" }} />
              <Stack.Screen name="profile" options={{ title: "Mi perfil" }} />
              <Stack.Screen name="profile/[id]" options={{ title: "Perfil" }} />
              <Stack.Screen name="settings" options={{ title: "Configuración" }} />
              <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            </Stack>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
