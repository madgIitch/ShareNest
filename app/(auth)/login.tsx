import { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
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
    if (!email || !password) { setError("Introduce tu email y contraseña."); return; }
    setLoading(true); setError(null);
    const { error: e } = await signIn(email.trim(), password);
    if (e) setError(e.message);
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={16} style={s.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Bienvenido{"\n"}de nuevo</Text>
          <Text style={s.subtitle}>Entra para ver tus solicitudes y mensajes</Text>

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
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={() => Alert.alert("Próximamente", "Recuperación de contraseña en la próxima versión.")}
                style={s.forgotBtn}
              >
                <Text style={s.forgotText}>¿La olvidaste?</Text>
              </Pressable>
            </View>
          </View>

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>o</Text>
            <View style={s.dividerLine} />
          </View>

          <Pressable
            style={s.googleBtn}
            onPress={() => Alert.alert("Próximamente", "Google Sign-In llegará pronto.")}
          >
            <Text style={s.googleG}>G</Text>
            <Text style={s.googleText}>Continuar con Google</Text>
          </Pressable>

          <View style={s.registerRow}>
            <Text style={s.registerLabel}>¿No tienes cuenta? </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable><Text style={s.registerLink}>Regístrate</Text></Pressable>
            </Link>
          </View>
        </ScrollView>

        {/* pinned submit */}
        <View style={s.footer}>
          <Pressable style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitText}>Entrar</Text>}
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
  forgotBtn: { alignSelf: "flex-end", marginTop: 10 },
  forgotText: { fontSize: 14, color: "#F36A39" },
  errorBox: { marginTop: 16, borderRadius: 12, padding: 14, backgroundColor: "#2A1A14", borderWidth: 1, borderColor: "#5A2E20" },
  errorText: { fontSize: 13, color: "#FF9980" },
  divider: { flexDirection: "row", alignItems: "center", marginTop: 32, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#222" },
  dividerText: { fontSize: 13, color: "#555" },
  googleBtn: {
    marginTop: 16, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 14, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2E2E2E", gap: 12,
  },
  googleG: { fontSize: 22, fontWeight: "800", color: "#4285F4" },
  googleText: { fontSize: 15, fontWeight: "500", color: "#ccc" },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  registerLabel: { fontSize: 14, color: "#666" },
  registerLink: { fontSize: 14, fontWeight: "600", color: "#F36A39" },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
  submitBtn: { height: 58, borderRadius: 16, backgroundColor: "#F36A39", alignItems: "center", justifyContent: "center" },
  submitText: { fontSize: 17, fontWeight: "700", color: "#fff" },
});
