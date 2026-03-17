import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { getAvatarUrl, pickAvatar, resizeAvatar, uploadAvatar } from "../src/lib/avatar";
import { normalizePhoneNumber } from "../src/lib/phone";
import { useUpdateProfile } from "../src/hooks/useProfile";
import { useAuth } from "../src/providers/AuthProvider";

export default function ProfileScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const userId = session?.user?.id ?? "";

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const updateProfile = useUpdateProfile();

  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : profile?.avatar_url
      ? { uri: profile.avatar_url }
      : null;

  const handlePickAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const asset = await pickAvatar();
      if (!asset) return;

      setAvatarUri(asset.uri);

      const path = await uploadAvatar(userId, asset.uri);
      const thumbUrl = await resizeAvatar(userId, path);

      await updateProfile.mutateAsync({
        userId,
        updates: { avatar_url: thumbUrl },
      });
      await refreshProfile();
    } catch (error) {
      Alert.alert("Error al subir foto", (error as Error).message);
      setAvatarUri(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !username.trim()) {
      Alert.alert("Campos requeridos", "Nombre y username son obligatorios.");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        userId,
        updates: {
          full_name: fullName.trim(),
          username: username.trim(),
          bio: bio.trim() || null,
          city: city.trim() || null,
          phone: phone.trim() ? normalizePhoneNumber(phone) : null,
        },
      });
      await refreshProfile();
      Alert.alert("Guardado", "Tu perfil ha sido actualizado.");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  const handleVerifyPhone = () => {
    const normalized = phone.trim() ? normalizePhoneNumber(phone) : null;
    if (!normalized) {
      Alert.alert("Añade tu teléfono", "Guarda tu número antes de verificarlo.");
      return;
    }
    router.push({ pathname: "/verify-phone", params: { phone: normalized } });
  };

  const isVerified = !!profile?.verified_at;
  const saving = updateProfile.isPending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickAvatar} disabled={uploadingAvatar}>
            <View style={styles.avatarWrapper}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(fullName || "?")[0].toUpperCase()}
                  </Text>
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <Text style={styles.avatarLabel}>Cambiar foto</Text>
          </Pressable>
        </View>

        {/* Campos */}
        <Text style={styles.label}>Nombre completo *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Tu nombre"
        />

        <Text style={styles.label}>Username *</Text>
        <TextInput
          autoCapitalize="none"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="tu_username"
        />

        <Text style={styles.label}>Ciudad</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="Barcelona"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          multiline
          numberOfLines={3}
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Cuéntanos algo sobre ti..."
        />

        {/* Teléfono + verificación */}
        <Text style={styles.label}>Teléfono</Text>
        <View style={styles.phoneRow}>
          <TextInput
            keyboardType="phone-pad"
            style={[styles.input, styles.phoneInput]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+4915123456789"
          />
          <Pressable
            style={[styles.verifyButton, isVerified && styles.verifyButtonDone]}
            onPress={handleVerifyPhone}
            disabled={isVerified}
          >
            <Text style={styles.verifyButtonText}>
              {isVerified ? "✓ Verificado" : "Verificar"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f4f6fa",
    flexGrow: 1,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c7d7f0",
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1f63f1",
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
  bioInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  verifyButton: {
    backgroundColor: "#1f63f1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  verifyButtonDone: {
    backgroundColor: "#16a34a",
  },
  verifyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#1f63f1",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
