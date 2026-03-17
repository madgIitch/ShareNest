import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { pickAvatar, resizeAvatar, uploadAvatar } from "../src/lib/avatar";
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
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const userId = session?.user?.id ?? "";

  const handlePickAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const asset = await pickAvatar();
      if (!asset) return;

      setAvatarUri(asset.uri);
      const path = await uploadAvatar(userId, asset.uri);
      const thumbUrl = await resizeAvatar(userId, path);
      setAvatarUrl(thumbUrl);
    } catch (error) {
      Alert.alert("Error al subir foto", (error as Error).message);
      setAvatarUri(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

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
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });

      if (error) throw error;

      await refreshProfile();
      router.replace("/home");
    } catch (error) {
      Alert.alert("No se pudo guardar tu perfil", (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Bienvenido/a</Text>
      <Text style={styles.subtitle}>Completa tu perfil. Esta pantalla solo aparece una vez.</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Pressable onPress={handlePickAvatar} disabled={uploadingAvatar}>
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarIcon}>📷</Text>
              </View>
            )}
            {uploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.avatarLabel}>
            {avatarUri ? "Cambiar foto" : "Añadir foto de perfil"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Nombre completo *</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Tu nombre" />

      <Text style={styles.label}>Username *</Text>
      <TextInput
        autoCapitalize="none"
        style={styles.input}
        placeholder="ejemplo: laura_berlin"
        value={username}
        onChangeText={setUsername}
      />

      <Text style={styles.label}>Ciudad</Text>
      <TextInput style={styles.input} placeholder="Barcelona" value={city} onChangeText={setCity} />

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
        placeholder="Cuéntanos algo sobre ti..."
        value={bio}
        onChangeText={setBio}
      />

      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? "Guardando..." : "Guardar y continuar"}
        </Text>
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
    marginBottom: 6,
    color: "#111827",
  },
  subtitle: {
    color: "#666",
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
    marginBottom: 8,
  },
  avatar: {
    width: 88,
    height: 88,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#e8f0fe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#c7d7f0",
    borderStyle: "dashed",
  },
  avatarIcon: {
    fontSize: 30,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLabel: {
    textAlign: "center",
    fontSize: 13,
    color: "#1f63f1",
    fontWeight: "600",
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
    fontSize: 16,
    color: "#111827",
  },
  bio: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#1f63f1",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
