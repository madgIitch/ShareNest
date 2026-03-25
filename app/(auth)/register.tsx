import { useState } from "react";
import {
  ActivityIndicator,
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

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Completa los tres campos para crear tu cuenta.");
      return;
    }

    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signUpError } = await signUp(email.trim(), password);
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace("/(auth)/onboarding");
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
            className="mt-10 h-12 w-12 items-center justify-center"
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={34} color="#FFFFFF" />
          </Pressable>

          <Text className="mt-4 text-[28px] font-extrabold text-white">
            Crea tu cuenta
          </Text>
          <Text className="mt-3 text-[18px] leading-7 text-[#B9B0A9]">
            En menos de un minuto podras completar tu perfil y empezar a explorar.
          </Text>

          <View className="mt-10 gap-6">
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
                placeholder="Minimo 6 caracteres"
                placeholderTextColor="#B5AEA9"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View>
              <Text className="mb-3 text-[14px] font-medium text-[#C8C1BB]">
                REPITE LA CONTRASENA
              </Text>
              <TextInput
                className="h-16 rounded-[14px] px-5 text-[18px] text-white"
                style={{ borderWidth: 1, borderColor: "#494949", backgroundColor: "#333230" }}
                placeholder="Confirma tu contrasena"
                placeholderTextColor="#B5AEA9"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {error ? (
            <View
              className="mt-5 rounded-2xl px-4 py-3"
              style={{ borderWidth: 1, borderColor: "#8A4B37", backgroundColor: "#402920" }}
            >
              <Text className="text-[14px] text-[#FFD2C5]">{error}</Text>
            </View>
          ) : null}

          <View className="flex-1" />

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            className="h-20 items-center justify-center rounded-[18px]"
            style={{ borderWidth: 1, borderColor: "#5A5A5A" }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-[20px] font-bold text-white">Continuar</Text>
            )}
          </Pressable>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-[16px] text-[#C0B8B2]">Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-[16px] font-medium text-[#F36A39]">Entrar</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
