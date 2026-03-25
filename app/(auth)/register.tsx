import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
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
    if (!email || !password || !confirmPassword) { setError("Completa todos los campos."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true); setError(null);
    const { error: e } = await signUp(email.trim(), password);
    if (e) { setError(e.message); setLoading(false); return; }
    setLoading(false);
    router.replace("/(auth)/onboarding");
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={16} style={s.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Crea tu{"\n"}cuenta</Text>
          <Text style={s.subtitle}>En menos de un minuto estarás explorando pisos.</Text>

          <View style={s.fields}>
            <View>
              <Text style={s.label}>EMAIL</Text>
              <TextInput
                style={s.input}
                placeholder="tu@email.com"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View>
              <Text style={s.label}>CONTRASEÑA</Text>
              <TextInput
                style={s.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#555"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View>
              <Text style={s.label}>REPITE LA CONTRASEÑA</Text>
              <TextInput
                style={s.input}
                placeholder="Confirma tu contraseña"
                placeholderTextColor="#555"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <View style={s.loginRow}>
            <Text style={s.loginLabel}>¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable><Text style={s.loginLink}>Entrar</Text></Pressable>
            </Link>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <Pressable style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitText}>Continuar</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111111" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  title: { fontSize: 36, fontWeight: "800", color: "#fff", lineHeight: 42, marginTop: 8 },
  subtitle: { marginTop: 10, fontSize: 15, color: "#8A8480", lineHeight: 22 },
  fields: { marginTop: 36, gap: 24 },
  label: { fontSize: 11, fontWeight: "600", color: "#666", letterSpacing: 1, marginBottom: 10 },
  input: {
    height: 56, borderRadius: 14, paddingHorizontal: 18, fontSize: 16, color: "#fff",
    backgroundColor: "#1E1E1E", borderWidth: 1, borderColor: "#2E2E2E",
  },
  errorBox: { marginTop: 20, borderRadius: 12, padding: 14, backgroundColor: "#2A1A14", borderWidth: 1, borderColor: "#5A2E20" },
  errorText: { fontSize: 13, color: "#FF9980" },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  loginLabel: { fontSize: 14, color: "#666" },
  loginLink: { fontSize: 14, fontWeight: "600", color: "#F36A39" },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
  submitBtn: { height: 58, borderRadius: 16, backgroundColor: "#F36A39", alignItems: "center", justifyContent: "center" },
  submitText: { fontSize: 17, fontWeight: "700", color: "#fff" },
});
