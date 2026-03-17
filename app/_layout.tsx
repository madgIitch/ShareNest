import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../src/providers/AuthProvider";
import { QueryProvider } from "../src/providers/QueryProvider";
import { ToastProvider } from "../src/providers/ToastProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <Stack
                screenOptions={{
                  headerTitleAlign: "center",
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="verify-phone" options={{ title: "Verificar móvil" }} />
                <Stack.Screen name="onboarding" options={{ title: "Bienvenido/a" }} />
                <Stack.Screen name="profile" options={{ title: "Mi perfil" }} />
                <Stack.Screen name="profile/[id]" options={{ title: "Perfil" }} />
                <Stack.Screen name="settings" options={{ title: "Configuración" }} />
                <Stack.Screen name="components-demo" options={{ title: "UI Components" }} />
                <Stack.Screen name="listing/new" options={{ title: "Nuevo anuncio" }} />
                <Stack.Screen name="listing/[id]/index" options={{ title: "Anuncio" }} />
                <Stack.Screen name="listing/[id]/edit" options={{ title: "Editar anuncio" }} />
                <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
                <Stack.Screen name="conversation/[id]" options={{ title: "Chat" }} />
                <Stack.Screen name="requests/[id]" options={{ title: "Solicitud" }} />
              </Stack>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
