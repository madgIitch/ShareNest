import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";

import { normalizePhoneNumber } from "../src/lib/phone";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/providers/AuthProvider";

export default function OnboardingScreen() {
  const { session, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!session?.user?.id) {
      Alert.alert("Sesión no válida", "Vuelve al login e inténtalo otra vez.");
      return;
    }

    if (!fullName.trim() || !username.trim()) {
      Alert.alert("Datos incompletos", "Nombre y username son obligatorios.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        username: username.trim(),
        full_name: fullName.trim(),
        city: city.trim() || null,
        bio: bio.trim() || null,
        phone: phone.trim() ? normalizePhoneNumber(phone) : null,
      });

      if (error) {
        throw error;
      }

      await refreshProfile();
      router.replace("/home");
    } catch (error) {
      Alert.alert("No se pudo guardar tu perfil", (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bienvenido/a</Text>
      <Text style={styles.subtitle}>Completa tu perfil. Esta pantalla solo aparece una vez.</Text>

      <Text style={styles.label}>Nombre completo *</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Username *</Text>
      <TextInput
        autoCapitalize="none"
        style={styles.input}
        placeholder="ejemplo: laura_berlin"
        value={username}
        onChangeText={setUsername}
      />

      <Text style={styles.label}>Ciudad</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        keyboardType="phone-pad"
        style={styles.input}
        placeholder="+4915123456789"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        multiline
        numberOfLines={3}
        style={[styles.input, styles.bio]}
        value={bio}
        onChangeText={setBio}
      />

      <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>Guardar y continuar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    marginBottom: 20,
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
    marginBottom: 12,
  },
  bio: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 8,
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
