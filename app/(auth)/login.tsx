import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/hooks/useAuth";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Introduce tu email y tu contrasena.");
      return;
    }

    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) setError(signInError.message);
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#151515" }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        className="flex-1 px-6 pb-6"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-1 rounded-[40px] px-7 py-6"
          style={{ borderWidth: 1, borderColor: "#4F4F4F", backgroundColor: "#343331" }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-white">9:41</Text>
            <View className="flex-row items-center gap-1">
              <View className="h-5 w-1 rounded-full bg-white" />
              <View className="h-6 w-1 rounded-full bg-white" />
              <View className="h-7 w-1 rounded-full bg-white" />
              <View className="ml-1 h-7 w-9 rounded-md border border-white" />
            </View>
          </View>

          <Pressable
            onPress={() => router.back()}
            className="mt-14 h-12 w-12 items-center justify-center"
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={34} color="#FFFFFF" />
          </Pressable>

          <Text className="mt-4 text-[28px] font-extrabold text-white">
            Bienvenido de nuevo
          </Text>
          <Text className="mt-3 text-[18px] leading-7 text-[#B9B0A9]">
            Entra para ver tus solicitudes y mensajes
          </Text>

          <View className="mt-12 gap-6">
            <View>
              <Text className="mb-3 text-[14px] font-medium text-[#C8C1BB]">EMAIL</Text>
              <TextInput
                className="h-16 rounded-[14px] px-5 text-[18px] text-white"
                style={{ borderWidth: 1, borderColor: "#494949", backgroundColor: "#333230" }}
                placeholder="tu@email.com"
                placeholderTextColor="#E7E0DB"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="mb-3 text-[14px] font-medium text-[#C8C1BB]">CONTRASENA</Text>
              <TextInput
                className="h-16 rounded-[14px] px-5 text-[18px] text-white"
                style={{ borderWidth: 1, borderColor: "#494949", backgroundColor: "#333230" }}
                placeholder="••••••••"
                placeholderTextColor="#E7E0DB"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert(
                "Proximamente",
                "La recuperacion de contrasena llegara en la siguiente iteracion."
              )
            }
            className="mt-4 self-end"
          >
            <Text className="text-[17px] font-medium text-[#F36A39]">La olvidaste?</Text>
          </Pressable>

          {error ? (
            <View
              className="mt-4 rounded-2xl px-4 py-3"
              style={{ borderWidth: 1, borderColor: "#8A4B37", backgroundColor: "#402920" }}
            >
              <Text className="text-[14px] text-[#FFD2C5]">{error}</Text>
            </View>
          ) : null}

          <View className="mt-8 flex-row items-center">
            <View className="h-px flex-1" style={{ backgroundColor: "#4D4D4D" }} />
            <Text className="mx-5 text-[16px] text-[#B9B0A9]">o</Text>
            <View className="h-px flex-1" style={{ backgroundColor: "#4D4D4D" }} />
          </View>

          <Pressable
            onPress={() =>
              Alert.alert(
                "Proximamente",
                "Google Sign-In todavia no esta conectado en esta version."
              )
            }
            className="mt-8 h-20 flex-row items-center justify-center rounded-[18px]"
            style={{ borderWidth: 1, borderColor: "#4F4F4F" }}
          >
            <Text className="mr-4 text-[30px] font-bold text-[#4285F4]">G</Text>
            <Text className="text-[18px] font-medium text-white">Continuar con Google</Text>
          </Pressable>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-[16px] text-[#C0B8B2]">No tienes cuenta? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text className="text-[16px] font-medium text-[#F36A39]">Registrate</Text>
              </Pressable>
            </Link>
          </View>

          <View className="flex-1" />

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="h-20 items-center justify-center rounded-[18px]"
            style={{ borderWidth: 1, borderColor: "#5A5A5A" }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-[20px] font-bold text-white">Entrar</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
