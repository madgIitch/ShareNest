import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/providers/AuthProvider";

export default function VerifyPhoneScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const { session, refreshProfile } = useAuth();
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const phone = params.phone ?? "";

  const handleVerify = async () => {
    const token = otpCode.trim();
    if (token.length < 4) {
      Alert.alert("Código inválido", "Introduce el código SMS de 6 dígitos.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });

      if (error) throw error;

      // Marcar el teléfono como verificado en el perfil
      if (session?.user?.id) {
        await supabase
          .from("profiles")
          .update({ verified_at: new Date().toISOString() })
          .eq("id", session.user.id);
        await refreshProfile();
      }

      router.back();
    } catch (error) {
      Alert.alert("No se pudo verificar", (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifica tu número</Text>
      <Text style={styles.subtitle}>Código enviado a {phone}</Text>
      <TextInput
        keyboardType="number-pad"
        placeholder="123456"
        style={styles.input}
        value={otpCode}
        onChangeText={setOtpCode}
      />
      <Pressable style={styles.button} onPress={handleVerify} disabled={submitting}>
        <Text style={styles.buttonText}>Verificar OTP</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d3d3d3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#1c6ef2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
