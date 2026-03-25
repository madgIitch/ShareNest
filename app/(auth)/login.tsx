import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import Button from "../../src/components/ui/Button";
import Input from "../../src/components/ui/Input";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">HomiMatch</Text>
        <Text className="text-gray-500 mb-8">
          Encuentra tu habitación ideal
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

        <Button title="Iniciar sesión" onPress={handleLogin} loading={loading} />

        <View className="mt-4 flex-row justify-center">
          <Text className="text-gray-500">¿No tienes cuenta? </Text>
          <Link href="/(auth)/register">
            <Text className="text-indigo-600 font-semibold">Regístrate</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
