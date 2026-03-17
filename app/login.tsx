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
        });
        if (error) throw error;
        Alert.alert("Cuenta creada", "Ya puedes iniciar sesion con tu email y contraseña.");
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
    backgroundColor: "#f4f6fa",
    padding: 20,
  },
  header: {
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  brand: {
    fontSize: 32,
    fontWeight: "700",
    color: "#121826",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: "#5b6472",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  switcher: {
    flexDirection: "row",
    backgroundColor: "#f2f4f8",
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  switchButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  switchButtonActive: {
    backgroundColor: "#ffffff",
  },
  switchText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5565",
  },
  switchTextActive: {
    color: "#111827",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#253041",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d5dbe6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  primaryButton: {
    backgroundColor: "#1f63f1",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
