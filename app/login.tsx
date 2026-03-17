import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "../src/lib/supabase";

type Mode = "login" | "register";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert("Campos requeridos", "Introduce tu email y contraseña.");
      return;
    }

    try {
      setSubmitting(true);

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: "sharenest://auth/callback",
          },
        });
        if (error) throw error;
        Alert.alert("Cuenta creada", "Revisa tu email para confirmar la cuenta.");
      }
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>ShareNest</Text>
        <Text style={styles.tagline}>Encuentra tu proxima casa</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.switcher}>
          <Pressable
            style={[styles.switchButton, isLogin && styles.switchButtonActive]}
            onPress={() => setMode("login")}
            disabled={submitting}
          >
            <Text style={[styles.switchText, isLogin && styles.switchTextActive]}>
              Iniciar sesion
            </Text>
          </Pressable>
          <Pressable
            style={[styles.switchButton, !isLogin && styles.switchButtonActive]}
            onPress={() => setMode("register")}
            disabled={submitting}
          >
            <Text style={[styles.switchText, !isLogin && styles.switchTextActive]}>
              Registrarse
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="••••••••"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.primaryText}>
            {isLogin ? "Entrar" : "Crear cuenta"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f3f3f5",
    padding: 20,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    color: "#10b981",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  switcher: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 9999,
    padding: 4,
    marginBottom: 20,
  },
  switchButton: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 10,
    alignItems: "center",
  },
  switchButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  switchText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  switchTextActive: {
    color: "#111827",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },
  input: {
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#f3f4f6",
  },
  primaryButton: {
    backgroundColor: "#10b981",
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
