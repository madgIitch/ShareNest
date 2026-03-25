import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Switch, Text, TextInput, View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/stores/authStore";
import { useConnections } from "../../src/hooks/useConnections";
import { useProfile } from "../../src/hooks/useProfile";

type StepKey = "profile" | "lifestyle" | "photos" | "goal" | "friendz";
type ScheduleOption = "madrugador" | "nocturno" | "flexible";
type LookingForOption = "room" | "flatmate" | "both";

type FormState = {
  full_name: string; username: string; birth_date: Date | null; occupation: string;
  avatar_url: string | null; schedule: ScheduleOption; cleanliness: number;
  noise_level: number; has_pets: boolean; smokes: boolean; works_from_home: boolean;
  photos: string[]; looking_for: LookingForOption;
};

const STEPS: StepKey[] = ["profile", "lifestyle", "photos", "goal", "friendz"];
const STEP_LABELS: Record<StepKey, string> = {
  profile: "Tu perfil", lifestyle: "Estilo de vida",
  photos: "Tus fotos", goal: "Qué buscas", friendz: "Tu red",
};
const PALETTE = ["#F07B2E", "#EF6C3B", "#458CE8", "#45C980", "#9450B8"];

const SCHEDULE_CARDS = [
  { value: "madrugador" as const, title: "Madrugador", sub: "Me levanto pronto", icon: "sunny-outline" as const },
  { value: "nocturno" as const, title: "Nocturno", sub: "Me acuesto tarde", icon: "moon-outline" as const },
  { value: "flexible" as const, title: "Flexible", sub: "Me adapto", icon: "swap-horizontal-outline" as const },
  { value: "works_from_home" as const, title: "Teletrabajo", sub: "Trabajo en casa", icon: "home-outline" as const },
];

const GOAL_CARDS = [
  { value: "room" as const, title: "Busco habitación", sub: "Quiero encontrar un piso", icon: "search-outline" as const },
  { value: "flatmate" as const, title: "Tengo habitación libre", sub: "Busco compañero de piso", icon: "home-outline" as const },
  { value: "both" as const, title: "Ambas cosas", sub: "Busco y también ofrezco", icon: "repeat-outline" as const },
];

export default function OnboardingScreen() {
  const { user } = useAuthStore();
  const { profile, isLoading, saveProfile, saving } = useProfile(user?.id);
  const { suggestions, loadingSuggestions, connect, connecting, connectingTo } = useConnections(user?.id);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    full_name: "", username: "", birth_date: null, occupation: "",
    avatar_url: null, schedule: "madrugador", cleanliness: 4, noise_level: 2,
    has_pets: false, smokes: false, works_from_home: false, photos: [], looking_for: "room",
  });

  useEffect(() => {
    if (!profile) return;
    setForm((c) => ({
      ...c,
      full_name: profile.full_name ?? c.full_name,
      username: profile.username ? `@${profile.username}` : c.username,
      birth_date: profile.birth_year ? new Date(profile.birth_year, 0, 1) : c.birth_date,
      occupation: profile.occupation ?? c.occupation,
      avatar_url: profile.avatar_url ?? c.avatar_url,
      schedule: (profile.schedule as ScheduleOption | null) ?? c.schedule,
      cleanliness: profile.cleanliness ?? c.cleanliness,
      noise_level: profile.noise_level ?? c.noise_level,
      has_pets: profile.has_pets ?? c.has_pets,
      smokes: profile.smokes ?? c.smokes,
      works_from_home: profile.works_from_home ?? c.works_from_home,
      photos: profile.photos ?? c.photos,
      looking_for: (profile.looking_for as LookingForOption | null) ?? c.looking_for,
    }));
  }, [profile]);

  const currentStep = STEPS[step];

  if (!user) {
    return (
      <SafeAreaView style={[s.root, { alignItems: "center", justifyContent: "center", padding: 32 }]}>
        <StatusBar style="light" />
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center", lineHeight: 24 }}>
          Crea tu cuenta o inicia sesión primero.
        </Text>
        <Pressable onPress={() => router.replace("/(auth)")} style={[s.submitBtn, { marginTop: 24 }]}>
          <Text style={s.submitText}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const persist = async () => {
    await saveProfile({
      full_name: form.full_name.trim() || null,
      username: form.username.trim().replace(/^@/, "") || null,
      birth_year: form.birth_date ? form.birth_date.getFullYear() : null,
      occupation: form.occupation.trim() || null,
      avatar_url: form.avatar_url,
      schedule: form.schedule,
      cleanliness: form.cleanliness,
      noise_level: form.noise_level,
      has_pets: form.has_pets,
      smokes: form.smokes,
      works_from_home: form.works_from_home,
      photos: form.photos.length ? form.photos : null,
      looking_for: form.looking_for,
    });
  };

  const validate = () => {
    if (currentStep !== "profile") return true;
    if (!form.full_name.trim() || !form.username.trim() || !form.occupation.trim()) {
      Alert.alert("Faltan datos", "Rellena nombre, username y ocupación."); return false;
    }
    if (!form.birth_date) {
      Alert.alert("Fecha requerida", "Selecciona tu fecha de nacimiento."); return false;
    }
    const year = form.birth_date.getFullYear();
    if (year < 1940 || year > new Date().getFullYear() - 16) {
      Alert.alert("Fecha inválida", "Debes tener al menos 16 años."); return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    try {
      await persist();
      if (step === STEPS.length - 1) router.replace("/(tabs)");
      else setStep((c) => c + 1);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Inténtalo de nuevo.");
    }
  };

  const pickImage = async (index?: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.8 });
    if (res.canceled || !res.assets[0]?.uri) return;
    const uri = res.assets[0].uri;
    if (typeof index === "number") {
      setForm((c) => { const p = [...c.photos]; p[index] = uri; return { ...c, photos: p }; });
    } else {
      setForm((c) => ({ ...c, avatar_url: uri }));
    }
  };

  const avatarIndex = (form.full_name.trim().charCodeAt(0) || 0) % PALETTE.length;
  const avatarInitial = form.full_name.trim().charAt(0).toUpperCase() || "P";

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* Progress bar */}
      <View style={s.progressWrap}>
        {STEPS.map((_, i) => (
          <View key={i} style={[s.progressBar, { backgroundColor: i <= step ? "#F36A39" : "#222" }]} />
        ))}
      </View>

      {/* Step label */}
      <View style={s.stepLabelRow}>
        <Text style={s.stepLabel}>Paso {step + 1} de {STEPS.length} · {STEP_LABELS[currentStep]}</Text>
        {step > 0 && (
          <Pressable onPress={() => setStep((c) => c - 1)} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#666" />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#F36A39" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── PROFILE ── */}
          {currentStep === "profile" && (
            <>
              <Text style={s.title}>Cuéntanos{"\n"}quién eres</Text>
              <Text style={s.subtitle}>Tu perfil genera confianza entre potenciales compañeros.</Text>

              <Pressable onPress={() => pickImage()} style={s.avatarBtn}>
                <View style={[s.avatarCircle, { backgroundColor: PALETTE[avatarIndex] }]}>
                  <Text style={s.avatarInitial}>{avatarInitial}</Text>
                </View>
                <View style={s.cameraTag}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </Pressable>

              <View style={s.fields}>
                <Field label="NOMBRE COMPLETO" value={form.full_name} onChangeText={(v) => setForm((c) => ({ ...c, full_name: v }))} placeholder="Pepe García" autoCapitalize="words" />
                <Field label="USERNAME" value={form.username} onChangeText={(v) => setForm((c) => ({ ...c, username: v.startsWith("@") ? v : `@${v.replace(/^@/, "")}` }))} placeholder="@pepegarcia" autoCapitalize="none" />
                <DatePickerField
                  label="FECHA DE NACIMIENTO"
                  value={form.birth_date}
                  onChange={(date) => setForm((c) => ({ ...c, birth_date: date }))}
                />
                <Field label="OCUPACIÓN" value={form.occupation} onChangeText={(v) => setForm((c) => ({ ...c, occupation: v }))} placeholder="Desarrollador" autoCapitalize="words" />
              </View>
            </>
          )}

          {/* ── LIFESTYLE ── */}
          {currentStep === "lifestyle" && (
            <>
              <Text style={s.title}>¿Cómo eres{"\n"}en casa?</Text>
              <Text style={s.subtitle}>Ayuda a encontrar compañeros compatibles.</Text>

              <Text style={s.sectionLabel}>HORARIO</Text>
              <View style={s.cardGrid}>
                {SCHEDULE_CARDS.map((card) => {
                  const active = card.value === "works_from_home" ? form.works_from_home : form.schedule === card.value;
                  return (
                    <Pressable
                      key={card.value}
                      style={[s.gridCard, active && s.gridCardActive]}
                      onPress={() =>
                        card.value === "works_from_home"
                          ? setForm((c) => ({ ...c, works_from_home: !c.works_from_home }))
                          : setForm((c) => ({ ...c, schedule: card.value as ScheduleOption }))
                      }
                    >
                      <Ionicons name={card.icon} size={26} color={active ? "#F36A39" : "#888"} />
                      <Text style={[s.gridCardTitle, active && s.gridCardTitleActive]}>{card.title}</Text>
                      <Text style={s.gridCardSub}>{card.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[s.sectionLabel, { marginTop: 28 }]}>NIVELES</Text>
              <RangeBar label="Limpieza" value={form.cleanliness} onChange={(v) => setForm((c) => ({ ...c, cleanliness: v }))} />
              <RangeBar label="Ruido" value={form.noise_level} onChange={(v) => setForm((c) => ({ ...c, noise_level: v }))} />

              <View style={s.togglesRow}>
                {[{ key: "has_pets" as const, label: "Mascotas" }, { key: "smokes" as const, label: "Fumo" }].map((item) => (
                  <View key={item.key} style={s.toggleCard}>
                    <Text style={s.toggleLabel}>{item.label}</Text>
                    <Switch
                      value={form[item.key]}
                      onValueChange={(v) => setForm((c) => ({ ...c, [item.key]: v }))}
                      trackColor={{ false: "#2A2A2A", true: "#F36A39" }}
                      thumbColor="#fff"
                    />
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── PHOTOS ── */}
          {currentStep === "photos" && (
            <>
              <Text style={s.title}>Pon cara{"\n"}al nombre</Text>
              <Text style={s.subtitle}>Los perfiles con foto reciben más solicitudes.</Text>

              <View style={s.photoGrid}>
                {Array.from({ length: 6 }).map((_, i) => {
                  const photo = form.photos[i];
                  return (
                    <Pressable
                      key={i}
                      style={[s.photoSlot, photo ? s.photoSlotFilled : s.photoSlotEmpty]}
                      onPress={() => pickImage(i)}
                    >
                      {photo ? (
                        <>
                          <Text style={s.photoAddedText}>✓ Añadida</Text>
                          <Pressable
                            style={s.photoRemove}
                            onPress={() => setForm((c) => ({ ...c, photos: c.photos.filter((_, pi) => pi !== i) }))}
                          >
                            <Ionicons name="close" size={14} color="#fff" />
                          </Pressable>
                        </>
                      ) : (
                        <Ionicons name="add" size={28} color="#444" />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={() => setStep(3)} style={s.skipBtn}>
                <Text style={s.skipText}>Saltar por ahora</Text>
              </Pressable>
            </>
          )}

          {/* ── GOAL ── */}
          {currentStep === "goal" && (
            <>
              <Text style={s.title}>¿Qué vas{"\n"}a hacer?</Text>
              <Text style={s.subtitle}>Puedes cambiarlo cuando quieras.</Text>

              <View style={s.goalList}>
                {GOAL_CARDS.map((card) => {
                  const active = form.looking_for === card.value;
                  return (
                    <Pressable
                      key={card.value}
                      style={[s.goalCard, active && s.goalCardActive]}
                      onPress={() => setForm((c) => ({ ...c, looking_for: card.value }))}
                    >
                      <View style={[s.goalIcon, active && s.goalIconActive]}>
                        <Ionicons name={card.icon} size={28} color={active ? "#F36A39" : "#888"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.goalTitle, active && s.goalTitleActive]}>{card.title}</Text>
                        <Text style={s.goalSub}>{card.sub}</Text>
                      </View>
                      <View style={[s.goalCheck, active && s.goalCheckActive]}>
                        {active && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* ── FRIENDZ ── */}
          {currentStep === "friendz" && (
            <>
              <Text style={s.title}>Conecta con{"\n"}quien conoces</Text>
              <Text style={s.subtitle}>Los anuncios muestran amigos en común con el publicador.</Text>

              <Pressable style={s.importRow}>
                <View style={s.importIcon}><Ionicons name="people-outline" size={28} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.importTitle}>Importar contactos</Text>
                  <Text style={s.importSub}>Encuentra a quienes ya conoces</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#555" />
              </Pressable>

              <Text style={[s.sectionLabel, { marginTop: 28 }]}>SUGERENCIAS</Text>

              {loadingSuggestions ? (
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <ActivityIndicator color="#F36A39" />
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {suggestions.map((person, i) => (
                    <View key={person.id} style={s.suggRow}>
                      <View style={[s.suggAvatar, { backgroundColor: PALETTE[(i + 1) % PALETTE.length] }]}>
                        <Text style={s.suggInitial}>{(person.full_name ?? "?").charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.suggName}>{person.full_name}</Text>
                        <Text style={s.suggSub}>{person.subtitle}</Text>
                      </View>
                      <Pressable
                        style={s.connectBtn}
                        disabled={person.status !== "none" || (connecting && connectingTo === person.id)}
                        onPress={() => connect(person.id).catch(() => {})}
                      >
                        {connecting && connectingTo === person.id
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={s.connectText}>
                              {person.status === "accepted" ? "Conectado" : person.status === "pending" ? "Enviado" : "Conectar"}
                            </Text>}
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <Pressable onPress={() => router.replace("/(tabs)")} style={s.skipBtn}>
                <Text style={s.skipText}>Saltar, lo hago después</Text>
              </Pressable>
            </>
          )}

        </ScrollView>
      )}

      {/* Footer */}
      <View style={s.footer}>
        <Pressable style={[s.submitBtn, saving && { opacity: 0.6 }]} onPress={handleContinue} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>{currentStep === "friendz" ? "Empezar a explorar" : "Continuar"}</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DatePickerField({ label, value, onChange }: {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
}) {
  const [show, setShow] = useState(false);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 16);

  const display = value
    ? value.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === "android") setShow(false);
    if (selected) onChange(selected);
  };

  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <Pressable style={[s.input, { justifyContent: "center" }]} onPress={() => setShow(true)}>
        <Text style={{ color: display ? "#fff" : "#555", fontSize: 15 }}>
          {display ?? "DD/MM/AAAA"}
        </Text>
      </Pressable>

      {/* Android: picker directo */}
      {Platform.OS === "android" && show && (
        <DateTimePicker
          value={value ?? maxDate}
          mode="date"
          maximumDate={maxDate}
          minimumDate={new Date(1940, 0, 1)}
          onChange={handleChange}
        />
      )}

      {/* iOS: picker en modal */}
      {Platform.OS === "ios" && (
        <Modal visible={show} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View style={{ backgroundColor: "#1A1A1A", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 }}>
                <Pressable onPress={() => setShow(false)} hitSlop={12}>
                  <Text style={{ color: "#F36A39", fontSize: 16, fontWeight: "600" }}>Listo</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={value ?? maxDate}
                mode="date"
                display="spinner"
                maximumDate={maxDate}
                minimumDate={new Date(1940, 0, 1)}
                onChange={handleChange}
                textColor="#fff"
                locale="es-ES"
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  keyboardType?: "default" | "numeric" | "email-address"; autoCapitalize?: "none" | "words";
}) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor="#555"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function RangeBar({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={{ color: "#ccc", fontSize: 15 }}>{label}</Text>
        <Text style={{ color: "#F36A39", fontSize: 15, fontWeight: "700" }}>{value} / 5</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i <= value ? "#F36A39" : "#2A2A2A" }}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111111" },
  progressWrap: { flexDirection: "row", gap: 4, paddingHorizontal: 24, paddingTop: 8 },
  progressBar: { flex: 1, height: 3, borderRadius: 2 },
  stepLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
  stepLabel: { fontSize: 12, color: "#666", fontWeight: "500" },
  scroll: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 32, fontWeight: "800", color: "#fff", lineHeight: 38, marginTop: 16 },
  subtitle: { marginTop: 10, fontSize: 14, color: "#8A8480", lineHeight: 20 },

  avatarBtn: { alignSelf: "center", marginTop: 28 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 42, fontWeight: "800", color: "#fff" },
  cameraTag: { position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: "#222", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#111" },

  fields: { marginTop: 28, gap: 20 },
  label: { fontSize: 11, fontWeight: "600", color: "#555", letterSpacing: 1, marginBottom: 8 },
  input: { height: 52, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: "#fff", backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A" },

  sectionLabel: { fontSize: 11, fontWeight: "600", color: "#555", letterSpacing: 1, marginTop: 24, marginBottom: 12 },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCard: { width: "47%", borderRadius: 14, padding: 16, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A" },
  gridCardActive: { borderColor: "#F36A39", backgroundColor: "#1E120D" },
  gridCardTitle: { marginTop: 10, fontSize: 14, fontWeight: "600", color: "#888" },
  gridCardTitleActive: { color: "#F36A39" },
  gridCardSub: { marginTop: 2, fontSize: 12, color: "#555" },

  togglesRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  toggleCard: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1A1A1A", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2A2A2A" },
  toggleLabel: { fontSize: 14, color: "#ccc" },

  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 24 },
  photoSlot: { width: "31%", aspectRatio: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  photoSlotEmpty: { backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A", borderStyle: "dashed" },
  photoSlotFilled: { backgroundColor: "#2A2A2A" },
  photoAddedText: { fontSize: 11, color: "#888" },
  photoRemove: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },

  skipBtn: { alignSelf: "center", marginTop: 24, marginBottom: 8 },
  skipText: { fontSize: 13, color: "#555" },

  goalList: { marginTop: 24, gap: 10 },
  goalCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A" },
  goalCardActive: { borderColor: "#F36A39", backgroundColor: "#1E120D" },
  goalIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: "#222", alignItems: "center", justifyContent: "center" },
  goalIconActive: { backgroundColor: "#2A1507" },
  goalTitle: { fontSize: 14, fontWeight: "600", color: "#888" },
  goalTitleActive: { color: "#F36A39" },
  goalSub: { fontSize: 12, color: "#555", marginTop: 2 },
  goalCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center" },
  goalCheckActive: { backgroundColor: "#F36A39", borderColor: "#F36A39" },

  importRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, backgroundColor: "#1A1A1A", marginTop: 20, borderWidth: 1, borderColor: "#2A2A2A" },
  importIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: "#222", alignItems: "center", justifyContent: "center" },
  importTitle: { fontSize: 14, fontWeight: "600", color: "#ccc" },
  importSub: { fontSize: 12, color: "#555", marginTop: 2 },

  suggRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, backgroundColor: "#1A1A1A" },
  suggAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  suggInitial: { fontSize: 18, fontWeight: "700", color: "#fff" },
  suggName: { fontSize: 14, fontWeight: "600", color: "#ddd" },
  suggSub: { fontSize: 12, color: "#666", marginTop: 2 },
  connectBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#1E1E1E", borderWidth: 1, borderColor: "#333" },
  connectText: { fontSize: 13, fontWeight: "600", color: "#ccc" },

  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
  submitBtn: { height: 56, borderRadius: 16, backgroundColor: "#F36A39", alignItems: "center", justifyContent: "center" },
  submitText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
