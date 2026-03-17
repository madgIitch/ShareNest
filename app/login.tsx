import { useState } from "react";
import { Link, router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { env } from "../src/lib/env";
import { normalizePhoneNumber } from "../src/lib/phone";
import { supabase } from "../src/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleMagicLink = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert("Email requerido", "Introduce un email válido.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: "sharenest://auth/callback",
        },
      });

      if (error) {
        throw error;
      }

      Alert.alert("Revisa tu correo", "Te enviamos un magic link para entrar en ShareNest.");
    } catch (error) {
      Alert.alert("No se pudo enviar el link", (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneOtp = async () => {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone || normalizedPhone.length < 8) {
      Alert.alert("Teléfono inválido", "Usa formato internacional, por ejemplo +4915123456789.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });

      if (error) {
        throw error;
      }

      router.push({
        pathname: "/verify-phone",
        params: { phone: normalizedPhone },
      });
    } catch (error) {
      Alert.alert("No se pudo enviar el SMS", (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ShareNest</Text>
      <Text style={styles.subtitle}>Accede con magic link o SMS OTP.</Text>
      <Text style={styles.env}>Entorno activo: {env.appEnv}</Text>

      <Text style={styles.label}>Email (magic link)</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@example.com"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <Pressable style={styles.primaryButton} onPress={handleMagicLink} disabled={submitting}>
        <Text style={styles.primaryText}>Enviar magic link</Text>
      </Pressable>

      <Text style={[styles.label, styles.topSpacing]}>Móvil (OTP SMS)</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="phone-pad"
        placeholder="+4915123456789"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
      />
      <Pressable style={styles.secondaryButton} onPress={handlePhoneOtp} disabled={submitting}>
        <Text style={styles.secondaryText}>Enviar código OTP</Text>
      </Pressable>

      <Text style={styles.helper}>
        Si usas iOS/Android, configura el redirect scheme en Supabase Auth.
      </Text>
      <Link href="/" style={styles.link}>
        Volver al inicio
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  env: {
    fontSize: 12,
    color: "#777",
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d3d3d3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  topSpacing: {
    marginTop: 14,
  },
  primaryButton: {
    backgroundColor: "#1c6ef2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryText: {
    color: "#1f3d86",
    fontWeight: "600",
  },
  helper: {
    marginTop: 18,
    fontSize: 13,
    color: "#666",
  },
  link: {
    marginTop: 10,
    color: "#1c6ef2",
    fontWeight: "600",
  },
});
