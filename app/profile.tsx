import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import { useMyFriendz } from "../src/hooks/useConnections";
import { useUpdateProfile } from "../src/hooks/useProfile";
import { pickAvatar, resizeAvatar, uploadAvatar } from "../src/lib/avatar";
import { normalizePhoneNumber } from "../src/lib/phone";
import { useAuth } from "../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../src/theme";

type NullableBool = boolean | null;
type LookingFor = "room" | "flat" | "both" | null;
type Schedule = "madrugador" | "nocturno" | "flexible" | null;
type GuestsFreq = "nunca" | "a veces" | "frecuente" | null;

const SCHEDULE_OPTIONS: { label: string; value: Exclude<Schedule, null> }[] = [
  { label: "Madrugador", value: "madrugador" },
  { label: "Nocturno", value: "nocturno" },
  { label: "Flexible", value: "flexible" },
];

const GUEST_OPTIONS: { label: string; value: Exclude<GuestsFreq, null> }[] = [
  { label: "Nunca", value: "nunca" },
  { label: "A veces", value: "a veces" },
  { label: "Frecuente", value: "frecuente" },
];

const LOOKING_OPTIONS: { label: string; value: Exclude<LookingFor, null> }[] = [
  { label: "Habitacion", value: "room" },
  { label: "Piso", value: "flat" },
  { label: "Ambos", value: "both" },
];

const LANGUAGE_OPTIONS = [
  "es",
  "en",
  "fr",
  "de",
  "it",
  "pt",
  "ca",
  "eu",
  "gl",
];

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fromIsoDate(value: string | null | undefined) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseCsv(input: string): string[] | null {
  const arr = input
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return arr.length > 0 ? arr : null;
}

function parseNumberOrNull(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) && v.trim() !== "" ? n : null;
}

function fieldDone(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function BoolChoice({
  label,
  value,
  onChange,
}: {
  label: string;
  value: NullableBool;
  onChange: (v: NullableBool) => void;
}) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRowCompact}>
        <Chip label="Si" active={value === true} onPress={() => onChange(true)} />
        <Chip label="No" active={value === false} onPress={() => onChange(false)} />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const userId = session?.user?.id ?? "";
  const { data: friendz = [] } = useMyFriendz(userId || undefined);

  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [preferredCitiesText, setPreferredCitiesText] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [moveInDate, setMoveInDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [schedule, setSchedule] = useState<Schedule>(null);
  const [cleanliness, setCleanliness] = useState<number | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<number | null>(null);
  const [worksFromHome, setWorksFromHome] = useState<NullableBool>(null);
  const [hasPets, setHasPets] = useState<NullableBool>(null);
  const [smokes, setSmokes] = useState<NullableBool>(null);
  const [guestsFrequency, setGuestsFrequency] = useState<GuestsFreq>(null);

  const [lookingFor, setLookingFor] = useState<LookingFor>(null);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setUsername(profile.username ?? "");
    setBio(profile.bio ?? "");
    setCity(profile.city ?? "");
    setPhone(profile.phone ?? "");
    setOccupation(profile.occupation ?? "");
    setBirthYear(profile.birth_year ? String(profile.birth_year) : "");
    setLanguages(profile.languages ?? []);
    setPreferredCitiesText((profile.preferred_cities ?? []).join(", "));
    setBudgetMin(profile.budget_min != null ? String(profile.budget_min) : "");
    setBudgetMax(profile.budget_max != null ? String(profile.budget_max) : "");
    setMoveInDate(profile.move_in_date ?? null);

    setSchedule(profile.schedule ?? null);
    setCleanliness(profile.cleanliness ?? null);
    setNoiseLevel(profile.noise_level ?? null);
    setWorksFromHome(profile.works_from_home ?? null);
    setHasPets(profile.has_pets ?? null);
    setSmokes(profile.smokes ?? null);
    setGuestsFrequency(profile.guests_frequency ?? null);

    setLookingFor(profile.looking_for ?? null);
  }, [profile]);

  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : profile?.avatar_url
      ? { uri: profile.avatar_url }
      : null;

  const completion = useMemo(() => {
    const checks = [
      fullName,
      username,
      city,
      bio,
      occupation,
      birthYear,
      schedule,
      cleanliness,
      noiseLevel,
      worksFromHome,
      hasPets,
      smokes,
      guestsFrequency,
      lookingFor,
      budgetMin,
      budgetMax,
      moveInDate,
    ];
    const done = checks.filter(fieldDone).length;
    return Math.round((done / checks.length) * 100);
  }, [
    fullName,
    username,
    city,
    bio,
    occupation,
    birthYear,
    schedule,
    cleanliness,
    noiseLevel,
    worksFromHome,
    hasPets,
    smokes,
    guestsFrequency,
    lookingFor,
    budgetMin,
    budgetMax,
    moveInDate,
  ]);

  const isVerified = !!profile?.verified_at;
  const saving = updateProfile.isPending;

  const handlePickAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const asset = await pickAvatar();
      if (!asset) return;

      setAvatarUri(asset.uri);
      const path = await uploadAvatar(userId, asset.uri);
      const thumbUrl = await resizeAvatar(userId, path);

      await updateProfile.mutateAsync({ userId, updates: { avatar_url: thumbUrl } });
      await refreshProfile();
    } catch (error) {
      Alert.alert("Error al subir foto", (error as Error).message);
      setAvatarUri(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleVerifyPhone = () => {
    const normalized = phone.trim() ? normalizePhoneNumber(phone) : null;
    if (!normalized) {
      Alert.alert("Anade tu telefono", "Guarda tu numero antes de verificarlo.");
      return;
    }
    router.push({ pathname: "/verify-phone", params: { phone: normalized } });
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "set" && selectedDate) setMoveInDate(toIsoDate(selectedDate));
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
          occupation: occupation.trim() || null,
          birth_year: parseNumberOrNull(birthYear),
          languages: languages.length > 0 ? languages : null,
          schedule,
          cleanliness,
          noise_level: noiseLevel,
          has_pets: hasPets,
          smokes,
          works_from_home: worksFromHome,
          guests_frequency: guestsFrequency,
          looking_for: lookingFor,
          budget_min: parseNumberOrNull(budgetMin),
          budget_max: parseNumberOrNull(budgetMax),
          move_in_date: moveInDate,
          preferred_cities: parseCsv(preferredCitiesText),
        },
      });
      await refreshProfile();
      Alert.alert("Guardado", "Tu perfil se actualizo correctamente.");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  const previewCta = lookingFor === "room" ? "Ofrecer habitacion" : lookingFor === "flat" ? "Solicitar habitacion" : "Enviar mensaje";

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.headerTitle}>Editar perfil</Text>
            <Text style={styles.completionPill}>{completion}% completo</Text>
          </View>
          <Text style={styles.headerSub}>Completa tu perfil para mejorar confianza y matching.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Identidad</Text>
          <View style={styles.avatarSection}>
            <Pressable onPress={handlePickAvatar} disabled={uploadingAvatar}>
              <View style={styles.avatarWrapper}>
                {avatarSource ? (
                  <Image source={avatarSource} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{(fullName || "?")[0].toUpperCase()}</Text>
                  </View>
                )}
                {uploadingAvatar && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color={colors.white} />
                  </View>
                )}
              </View>
              <Text style={styles.linkText}>Cambiar foto</Text>
            </Pressable>

            <View style={{ gap: spacing[2], alignItems: "flex-end" }}>
              <View style={[styles.verifyBadge, isVerified ? styles.verifyBadgeOk : styles.verifyBadgePending]}>
                <Text style={styles.verifyBadgeText}>{isVerified ? "Verificado" : "Sin verificar"}</Text>
              </View>
              <Pressable style={styles.verifyBtn} onPress={handleVerifyPhone}>
                <Text style={styles.verifyBtnText}>{isVerified ? "Actualizar telefono" : "Verificar telefono"}</Text>
              </Pressable>
            </View>
          </View>

          <LabeledInput label="Nombre completo *" value={fullName} onChangeText={setFullName} placeholder="Tu nombre" />
          <LabeledInput label="Username *" value={username} onChangeText={setUsername} placeholder="tu_username" autoCapitalize="none" />
          <LabeledInput label="Profesion" value={occupation} onChangeText={setOccupation} placeholder="Disenador UX" />

          <View style={styles.twoCols}>
            <View style={{ flex: 1 }}>
              <LabeledInput label="Ano de nacimiento" value={birthYear} onChangeText={setBirthYear} placeholder="1998" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <LabeledInput label="Ciudad" value={city} onChangeText={setCity} placeholder="Madrid" />
            </View>
          </View>

          <LabeledInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Como eres y que buscas en convivencia"
            multiline
          />
          <LabeledInput
            label="Telefono"
            value={phone}
            onChangeText={setPhone}
            placeholder="+34..."
            keyboardType="phone-pad"
          />
          <Text style={styles.fieldLabel}>Idiomas</Text>
          {languages.length > 0 && (
            <View style={styles.selectedLanguagesRow}>
              {languages.map((lang) => (
                <View key={`selected-${lang}`} style={styles.selectedLanguageChip}>
                  <Text style={styles.selectedLanguageText}>{lang.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.chipRow}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <Chip
                key={lang}
                label={lang.toUpperCase()}
                active={languages.includes(lang)}
                onPress={() => toggleLanguage(lang)}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Estilo de vida</Text>

          <Text style={styles.fieldLabel}>Horario</Text>
          <View style={styles.chipRow}>
            {SCHEDULE_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} active={schedule === opt.value} onPress={() => setSchedule(opt.value)} />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Limpieza</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={`clean-${n}`} label={`${n}`} active={cleanliness === n} onPress={() => setCleanliness(n)} />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Ruido</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={`noise-${n}`} label={`${n}`} active={noiseLevel === n} onPress={() => setNoiseLevel(n)} />
            ))}
          </View>

          <BoolChoice label="Teletrabajo" value={worksFromHome} onChange={setWorksFromHome} />
          <BoolChoice label="Mascotas" value={hasPets} onChange={setHasPets} />
          <BoolChoice label="Fuma" value={smokes} onChange={setSmokes} />

          <Text style={styles.fieldLabel}>Frecuencia de visitas</Text>
          <View style={styles.chipRow}>
            {GUEST_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={guestsFrequency === opt.value}
                onPress={() => setGuestsFrequency(opt.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preferencias de busqueda</Text>

          <Text style={styles.fieldLabel}>Que buscas</Text>
          <View style={styles.chipRow}>
            {LOOKING_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} active={lookingFor === opt.value} onPress={() => setLookingFor(opt.value)} />
            ))}
          </View>

          <View style={styles.twoCols}>
            <View style={{ flex: 1 }}>
              <LabeledInput
                label="Presupuesto minimo"
                value={budgetMin}
                onChangeText={setBudgetMin}
                placeholder="500"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <LabeledInput
                label="Presupuesto maximo"
                value={budgetMax}
                onChangeText={setBudgetMax}
                placeholder="800"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Disponible desde</Text>
          <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateFieldText}>{moveInDate ?? "Seleccionar fecha"}</Text>
          </Pressable>
          {showDatePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={fromIsoDate(moveInDate)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "calendar"}
                onChange={onDateChange}
              />
              {Platform.OS === "ios" && (
                <Pressable style={styles.dateDoneBtn} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.dateDoneBtnText}>Listo</Text>
                </Pressable>
              )}
            </View>
          )}

          <LabeledInput
            label="Ciudades preferidas (coma separada)"
            value={preferredCitiesText}
            onChangeText={setPreferredCitiesText}
            placeholder="Madrid, Barcelona"
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Preview publico</Text>
          <View style={styles.previewCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.previewName}>{fullName || "Tu nombre"}</Text>
              <Text style={styles.previewMeta}>{birthYear ? `${new Date().getFullYear() - Number(birthYear)} anos` : "Edad"}</Text>
            </View>
            <Text style={styles.previewSub}>{occupation || "Profesion"} · {city || "Ciudad"}</Text>

            <View style={styles.mutualBlock}>
              <Text style={styles.mutualTitle}>
                {friendz.length > 0 ? `${Math.min(friendz.length, 3)} amigos en comun` : "Sin conexiones en comun"}
              </Text>
              <Text style={styles.mutualText} numberOfLines={1}>
                {friendz.length > 0
                  ? friendz.slice(0, 3).map((f) => f.full_name ?? "Usuario").join(", ")
                  : "Este bloque se mostrara al evaluar confianza."}
              </Text>
            </View>

            <View style={styles.previewGrid}>
              <PreviewItem title="Horario" value={schedule ?? "-"} />
              <PreviewItem title="Limpieza" value={cleanliness ? `${cleanliness}/5` : "-"} />
              <PreviewItem title="Teletrabajo" value={worksFromHome == null ? "-" : worksFromHome ? "Si" : "No"} />
              <PreviewItem title="Ruido" value={noiseLevel ? `${noiseLevel}/5` : "-"} />
              <PreviewItem title="Mascotas" value={hasPets == null ? "-" : hasPets ? "Si" : "No"} />
              <PreviewItem title="Fuma" value={smokes == null ? "-" : smokes ? "Si" : "No"} />
            </View>

            <Pressable style={styles.previewCta}>
              <Text style={styles.previewCtaText}>{previewCta}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Guardando..." : "Guardar cambios"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function PreviewItem({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.previewItem}>
      <Text style={styles.previewItemTitle}>{title}</Text>
      <Text style={styles.previewItemValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: spacing[3],
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[1],
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
  completionPill: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.verify,
    backgroundColor: colors.verifyLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
  },
  headerSub: { fontSize: fontSize.sm, color: colors.textSecondary },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },

  avatarSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  avatarWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: "hidden",
    backgroundColor: colors.gray200,
    marginBottom: spacing[1],
  },
  avatar: { width: 92, height: 92 },
  avatarPlaceholder: {
    width: 92,
    height: 92,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.purpleLight,
  },
  avatarInitial: { fontSize: 34, fontWeight: "800", color: colors.purple },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600", textAlign: "center" },

  verifyBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
  },
  verifyBadgeOk: { backgroundColor: colors.successLight },
  verifyBadgePending: { backgroundColor: colors.warningLight },
  verifyBadgeText: { fontSize: fontSize.xs, fontWeight: "700", color: colors.text },
  verifyBtn: {
    backgroundColor: colors.verify,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  verifyBtnText: { color: colors.white, fontSize: fontSize.xs, fontWeight: "700" },

  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textarea: { minHeight: 90 },
  twoCols: { flexDirection: "row", gap: spacing[2] },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginBottom: spacing[2] },
  chipRowCompact: { flexDirection: "row", gap: spacing[1] },
  selectedLanguagesRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[1], marginBottom: spacing[2] },
  selectedLanguageChip: {
    backgroundColor: colors.verifyLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
  },
  selectedLanguageText: { fontSize: fontSize.xs, color: colors.verify, fontWeight: "700" },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: colors.primary },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing[2] },

  dateField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    marginBottom: spacing[2],
  },
  dateFieldText: { fontSize: fontSize.md, color: colors.text },
  datePickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing[2],
  },
  dateDoneBtn: { alignSelf: "flex-end", paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  dateDoneBtnText: { color: colors.primary, fontWeight: "700" },

  previewCard: {
    backgroundColor: colors.gray50,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    gap: spacing[2],
  },
  previewName: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
  previewMeta: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600" },
  previewSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  mutualBlock: {
    backgroundColor: colors.purple,
    borderRadius: radius.md,
    padding: spacing[3],
    gap: 2,
  },
  mutualTitle: { color: colors.white, fontSize: fontSize.sm, fontWeight: "700" },
  mutualText: { color: colors.white, opacity: 0.9, fontSize: fontSize.xs },
  previewGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  previewItem: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[2],
    gap: 2,
  },
  previewItemTitle: { fontSize: fontSize.xs, color: colors.textTertiary, fontWeight: "600" },
  previewItemValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: "700" },
  previewCta: {
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    alignItems: "center",
    marginTop: spacing[1],
  },
  previewCtaText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },

  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginBottom: spacing[5],
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.white, fontWeight: "800", fontSize: fontSize.md },
});

