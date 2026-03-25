import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import Button from "../../src/components/ui/Button";
import Input from "../../src/components/ui/Input";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signUp(email, password);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</Text>
        <Text className="text-gray-500 mb-8">
          Únete a HomiMatch
        </Text>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        <Input
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <Button title="Crear cuenta" onPress={handleRegister} loading={loading} />

        <View className="mt-4 flex-row justify-center">
          <Text className="text-gray-500">¿Ya tienes cuenta? </Text>
          <Link href="/(auth)/login">
            <Text className="text-indigo-600 font-semibold">Iniciar sesión</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
