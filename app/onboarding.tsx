import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { colors, fontSize, radius, spacing } from "../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "🏠",
    title: "Encuentra tu piso ideal",
    desc: "Explora anuncios de pisos y compañeros en tu ciudad. Filtra por precio, tamaño y preferencias.",
  },
  {
    icon: "👥",
    title: "Conéctate con Friendz",
    desc: "Añade a otros usuarios a tu red. Ver anuncios de amigos y amigos de amigos primero.",
  },
  {
    icon: "💬",
    title: "Chatea de forma segura",
    desc: "Solicita una habitación y, cuando el propietario acepte, un chat privado se abre automáticamente.",
  },
];

export default function OnboardingScreen() {
  const { session, refreshProfile } = useAuth();
  const [step, setStep] = useState<"tutorial" | "profile">("tutorial");
  const [slideIndex, setSlideIndex] = useState(0);
  const slideScrollRef = useRef<ScrollView>(null);

  // Profile form state
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

  const handleNext = () => {
    if (slideIndex < SLIDES.length - 1) {
      const next = slideIndex + 1;
      setSlideIndex(next);
      slideScrollRef.current?.scrollTo({ x: SCREEN_WIDTH * next, animated: true });
    } else {
      setStep("profile");
    }
  };

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

  if (step === "tutorial") {
    const slide = SLIDES[slideIndex];
    return (
      <View style={styles.tutorialScreen}>
        {/* Slide scroller (hidden scroll, controlled programmatically) */}
        <ScrollView
          ref={slideScrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={styles.slideScroll}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={styles.slide}>
              <Text style={styles.slideIcon}>{s.icon}</Text>
              <Text style={styles.slideTitle}>{s.title}</Text>
              <Text style={styles.slideDesc}>{s.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
          ))}
        </View>

        {/* CTA */}
        <Pressable style={styles.nextBtn} onPress={handleNext} accessibilityLabel={slideIndex < SLIDES.length - 1 ? "Siguiente" : "Empezar"}>
          <Text style={styles.nextBtnText}>
            {slideIndex < SLIDES.length - 1 ? "Siguiente →" : "¡Vamos!"}
          </Text>
        </Pressable>

        <Pressable onPress={() => setStep("profile")} style={styles.skipBtn} accessibilityLabel="Saltar tutorial">
          <Text style={styles.skipBtnText}>Saltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Completa tu perfil</Text>
      <Text style={styles.subtitle}>Solo tienes que hacerlo una vez.</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Pressable onPress={handlePickAvatar} disabled={uploadingAvatar} accessibilityLabel="Añadir foto de perfil">
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
                <ActivityIndicator color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.avatarLabel}>
            {avatarUri ? "Cambiar foto" : "Añadir foto de perfil"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Nombre completo *</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Tu nombre"
        accessibilityLabel="Nombre completo"
      />

      <Text style={styles.label}>Username *</Text>
      <TextInput
        autoCapitalize="none"
        style={styles.input}
        placeholder="ejemplo: laura_berlin"
        value={username}
        onChangeText={setUsername}
        accessibilityLabel="Username"
      />

      <Text style={styles.label}>Ciudad</Text>
      <TextInput
        style={styles.input}
        placeholder="Barcelona"
        value={city}
        onChangeText={setCity}
        accessibilityLabel="Ciudad"
      />

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        keyboardType="phone-pad"
        style={styles.input}
        placeholder="+4915123456789"
        value={phone}
        onChangeText={setPhone}
        accessibilityLabel="Teléfono"
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        multiline
        numberOfLines={3}
        style={[styles.input, styles.bio]}
        placeholder="Cuéntanos algo sobre ti..."
        value={bio}
        onChangeText={setBio}
        accessibilityLabel="Bio"
      />

      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
        accessibilityLabel="Guardar y continuar"
      >
        <Text style={styles.buttonText}>
          {saving ? "Guardando..." : "Guardar y continuar"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Tutorial
  tutorialScreen: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing[8],
  },
  slideScroll: { width: SCREEN_WIDTH },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
    gap: spacing[4],
  },
  slideIcon: { fontSize: 72, marginBottom: spacing[2] },
  slideTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  slideDesc: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.gray200,
  },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    marginBottom: spacing[3],
  },
  nextBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  skipBtn: { paddingVertical: spacing[2] },
  skipBtnText: { color: colors.textSecondary, fontSize: fontSize.sm },

  // Profile form
  container: {
    padding: 24,
    backgroundColor: colors.surface,
    flexGrow: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 6,
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
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
  avatar: { width: 88, height: 88 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  avatarIcon: { fontSize: 30 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLabel: {
    textAlign: "center",
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  bio: { minHeight: 90, textAlignVertical: "top" },
  button: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
