import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
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
  full_name: string;
  username: string;
  birth_year: string;
  occupation: string;
  avatar_url: string | null;
  schedule: ScheduleOption;
  cleanliness: number;
  noise_level: number;
  has_pets: boolean;
  smokes: boolean;
  works_from_home: boolean;
  photos: string[];
  looking_for: LookingForOption;
};

const steps: StepKey[] = ["profile", "lifestyle", "photos", "goal", "friendz"];

const scheduleCards: Array<{
  value: ScheduleOption | "works_from_home";
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  { value: "madrugador", title: "Madrugador", subtitle: "Me levanto pronto", emoji: "🌅" },
  { value: "nocturno", title: "Nocturno", subtitle: "Me acuesto tarde", emoji: "🌙" },
  { value: "flexible", title: "Flexible", subtitle: "Me adapto", emoji: "🔄" },
  { value: "works_from_home", title: "Teletrabajo", subtitle: "Trabajo desde casa", emoji: "🏠" },
];

const goalCards = [
  {
    value: "room" as const,
    title: "Busco habitación",
    subtitle: "Quiero encontrar un piso donde vivir",
    emoji: "🔎",
  },
  {
    value: "flatmate" as const,
    title: "Tengo habitación libre",
    subtitle: "Quiero encontrar compañero de piso",
    emoji: "🏠",
  },
  {
    value: "both" as const,
    title: "Ambas cosas",
    subtitle: "Busco y también tengo habitación libre",
    emoji: "↔️",
  },
];

const avatarPalette = ["#F07B2E", "#EF6C3B", "#458CE8", "#45C980", "#9450B8"];

function ProgressDots({ step }: { step: number }) {
  return (
    <View className="flex-row gap-2">
      {steps.map((item, index) => (
        <View
          key={item}
          className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#F36A39]" : "bg-black/30"}`}
        />
      ))}
    </View>
  );
}

function RangeBar({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[18px] font-medium text-white">{label}</Text>
        <Text className="text-[18px] font-bold text-[#F36A39]">{value} / 5</Text>
      </View>
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            className={`h-3 flex-1 rounded-full ${item <= value ? "bg-[#F36A39]" : "bg-white/15"}`}
          />
        ))}
      </View>
    </View>
  );
}

function AvatarBadge({ uri, name }: { uri?: string | null; name: string }) {
  const index = (name.trim().charCodeAt(0) || 0) % avatarPalette.length;
  const initial = name.trim().charAt(0).toUpperCase() || "P";

  return (
    <View className="items-center">
      <View
        className="h-44 w-44 items-center justify-center rounded-full"
        style={{ backgroundColor: avatarPalette[index] }}
      >
        {uri ? (
          <View className="h-44 w-44 rounded-full border-2 border-white/15 bg-white/10" />
        ) : (
          <Text className="text-[62px] font-extrabold text-white">{initial}</Text>
        )}
      </View>
      <View className="-mt-10 ml-28 h-14 w-14 items-center justify-center rounded-full bg-[#1E1E1E]">
        <Ionicons name="camera" size={24} color="#FFFFFF" />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { user } = useAuthStore();
  const { profile, isLoading, saveProfile, saving } = useProfile(user?.id);
  const { suggestions, loadingSuggestions, connect, connecting, connectingTo } =
    useConnections(user?.id);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    full_name: "",
    username: "",
    birth_year: "1998",
    occupation: "",
    avatar_url: null,
    schedule: "madrugador",
    cleanliness: 4,
    noise_level: 2,
    has_pets: false,
    smokes: false,
    works_from_home: false,
    photos: [],
    looking_for: "room",
  });

  useEffect(() => {
    if (!profile) return;

    setForm((current) => ({
      ...current,
      full_name: profile.full_name ?? current.full_name,
      username: profile.username ? `@${profile.username}` : current.username,
      birth_year: profile.birth_year ? String(profile.birth_year) : current.birth_year,
      occupation: profile.occupation ?? current.occupation,
      avatar_url: profile.avatar_url ?? current.avatar_url,
      schedule: (profile.schedule as ScheduleOption | null) ?? current.schedule,
      cleanliness: profile.cleanliness ?? current.cleanliness,
      noise_level: profile.noise_level ?? current.noise_level,
      has_pets: profile.has_pets ?? current.has_pets,
      smokes: profile.smokes ?? current.smokes,
      works_from_home: profile.works_from_home ?? current.works_from_home,
      photos: profile.photos ?? current.photos,
      looking_for: (profile.looking_for as LookingForOption | null) ?? current.looking_for,
    }));
  }, [profile]);

  const currentStep = steps[step];
  const stepLabel = useMemo(
    () =>
      ({
        profile: "Tu perfil",
        lifestyle: "Tu estilo de vida",
        photos: "Tus fotos",
        goal: "Qué buscas",
        friendz: "Tu red",
      })[currentStep],
    [currentStep]
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#151515] px-8">
        <StatusBar style="light" />
        <Text className="text-center text-[18px] leading-8 text-white">
          Crea tu cuenta o inicia sesión antes de completar el onboarding.
        </Text>
        <Pressable
          onPress={() => router.replace("/(auth)")}
          className="mt-8 rounded-2xl border border-white/20 px-6 py-4"
        >
          <Text className="text-[17px] font-semibold text-white">Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const persistCurrentStep = async () => {
    await saveProfile({
      full_name: form.full_name.trim() || null,
      username: form.username.trim().replace(/^@/, "") || null,
      birth_year: form.birth_year ? Number(form.birth_year) : null,
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

  const validateCurrentStep = () => {
    if (currentStep !== "profile") return true;

    if (!form.full_name.trim() || !form.username.trim() || !form.occupation.trim()) {
      Alert.alert("Faltan datos", "Completa nombre, username y ocupación.");
      return false;
    }

    const birthYear = Number(form.birth_year);
    if (!birthYear || birthYear < 1940 || birthYear > new Date().getFullYear() - 16) {
      Alert.alert("Año inválido", "Introduce un año de nacimiento válido.");
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateCurrentStep()) return;

    try {
      await persistCurrentStep();
      if (step === steps.length - 1) {
        router.replace("/(tabs)");
      } else {
        setStep((current) => current + 1);
      }
    } catch (error) {
      Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Inténtalo de nuevo.");
    }
  };

  const pickImage = async (index?: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para añadir fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    const uri = result.assets[0].uri;
    if (typeof index === "number") {
      setForm((current) => {
        const nextPhotos = [...current.photos];
        nextPhotos[index] = uri;
        return { ...current, photos: nextPhotos };
      });
      return;
    }

    setForm((current) => ({ ...current, avatar_url: uri }));
  };

  const removePhoto = (index: number) => {
    setForm((current) => ({
      ...current,
      photos: current.photos.filter((_, photoIndex) => photoIndex !== index),
    }));
  };

  const handleConnect = async (targetId: string) => {
    try {
      await connect(targetId);
    } catch (error) {
      Alert.alert("No se pudo conectar", error instanceof Error ? error.message : "Inténtalo de nuevo.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#151515]">
      <StatusBar style="light" />
      <View className="flex-1 px-6 pb-6">
        <View className="flex-1 rounded-[40px] border border-white/20 bg-[#343331] px-7 py-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-white">9:41</Text>
            <View className="flex-row items-center gap-1">
              <View className="h-5 w-1 rounded-full bg-white/75" />
              <View className="h-6 w-1 rounded-full bg-white/75" />
              <View className="h-7 w-1 rounded-full bg-white/75" />
              <View className="ml-1 h-7 w-9 rounded-md border border-white/75" />
            </View>
          </View>

          <View className="mt-6">
            <ProgressDots step={step} />
            <Text className="mt-5 text-[16px] text-[#B9B0A9]">
              Paso {step + 1} de 5 · {stepLabel}
            </Text>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : (
            <>
              <ScrollView className="mt-6 flex-1" showsVerticalScrollIndicator={false}>
                {currentStep === "profile" ? (
                  <>
                    <Text className="text-[28px] font-extrabold text-white">Cuéntanos quién eres</Text>
                    <Text className="mt-3 text-[18px] leading-7 text-[#B9B0A9]">
                      Tu perfil genera confianza entre potenciales compañeros
                    </Text>

                    <Pressable onPress={() => pickImage()} className="mt-10 items-center">
                      <AvatarBadge uri={form.avatar_url} name={form.full_name || "Perfil"} />
                    </Pressable>

                    <View className="mt-10 gap-5">
                      <View>
                        <Text className="mb-3 text-[14px] font-medium tracking-[1.5px] text-[#C8C1BB]">
                          NOMBRE COMPLETO
                        </Text>
                        <TextInput
                          className="h-16 rounded-[14px] border border-white/10 bg-[#333230] px-5 text-[18px] text-white"
                          placeholder="Pepe García"
                          placeholderTextColor="#B5AEA9"
                          value={form.full_name}
                          onChangeText={(value) =>
                            setForm((current) => ({ ...current, full_name: value }))
                          }
                        />
                      </View>

                      <View>
                        <Text className="mb-3 text-[14px] font-medium tracking-[1.5px] text-[#C8C1BB]">
                          USERNAME
                        </Text>
                        <TextInput
                          className="h-16 rounded-[14px] border border-white/10 bg-[#333230] px-5 text-[18px] text-white"
                          placeholder="@pepegarcia"
                          placeholderTextColor="#B5AEA9"
                          autoCapitalize="none"
                          value={form.username}
                          onChangeText={(value) =>
                            setForm((current) => ({
                              ...current,
                              username: value.startsWith("@") ? value : `@${value.replace(/^@/, "")}`,
                            }))
                          }
                        />
                      </View>

                      <View>
                        <Text className="mb-3 text-[14px] font-medium tracking-[1.5px] text-[#C8C1BB]">
                          AÑO DE NACIMIENTO
                        </Text>
                        <TextInput
                          className="h-16 rounded-[14px] border border-white/10 bg-[#333230] px-5 text-[18px] text-white"
                          placeholder="1998"
                          placeholderTextColor="#B5AEA9"
                          keyboardType="numeric"
                          value={form.birth_year}
                          onChangeText={(value) =>
                            setForm((current) => ({
                              ...current,
                              birth_year: value.replace(/[^0-9]/g, ""),
                            }))
                          }
                        />
                      </View>

                      <View>
                        <Text className="mb-3 text-[14px] font-medium tracking-[1.5px] text-[#C8C1BB]">
                          OCUPACIÓN
                        </Text>
                        <TextInput
                          className="h-16 rounded-[14px] border border-white/10 bg-[#333230] px-5 text-[18px] text-white"
                          placeholder="Desarrollador"
                          placeholderTextColor="#B5AEA9"
                          value={form.occupation}
                          onChangeText={(value) =>
                            setForm((current) => ({ ...current, occupation: value }))
                          }
                        />
                      </View>
                    </View>
                  </>
                ) : null}

                {currentStep === "lifestyle" ? (
                  <>
                    <Text className="text-[28px] font-extrabold text-white">¿Cómo eres en casa?</Text>
                    <Text className="mt-3 text-[18px] leading-7 text-[#B9B0A9]">
                      Esto ayuda a encontrar compañeros compatibles
                    </Text>

                    <Text className="mt-10 text-[14px] font-medium tracking-[1.5px] text-[#C8C1BB]">
                      HORARIO
                    </Text>
                    <View className="mt-4 flex-row flex-wrap justify-between gap-y-4">
                      {scheduleCards.map((card) => {
                        const active =
                          card.value === "works_from_home"
                            ? form.works_from_home
                            : form.schedule === card.value;

                        return (
                          <Pressable
                            key={card.title}
                            onPress={() =>
                              card.value === "works_from_home"
                                ? setForm((current) => ({
                                    ...current,
                                    works_from_home: !current.works_from_home,
                                  }))
                                : setForm((current) => ({
                                    ...current,
                                    schedule: card.value as ScheduleOption,
                                  }))
                            }
                            className={`w-[48%] rounded-[22px] border px-6 py-6 ${
                              active ? "border-[#F36A39] bg-[#453932]" : "border-white/12"
                            }`}
                          >
                            <Text className="text-[28px]">{card.emoji}</Text>
                            <Text
                              className={`mt-4 text-[18px] font-semibold ${
                                active ? "text-[#F36A39]" : "text-white"
                              }`}
                            >
                              {card.title}
                            </Text>
                            <Text className="mt-1 text-[16px] leading-6 text-[#A89F99]">
                              {card.subtitle}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Text className="mt-10 text-[14px] font-medium tracking-[1.5px] text-[#C8C1BB]">
                      NIVELES
                    </Text>
                    <RangeBar
                      label="Limpieza"
                      value={form.cleanliness}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, cleanliness: value }))
                      }
                    />
                    <RangeBar
                      label="Ruido"
                      value={form.noise_level}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, noise_level: value }))
                      }
                    />

                    <View className="mt-8 flex-row justify-between">
                      {[
                        { key: "has_pets", label: "Mascotas", emoji: "🐾" },
                        { key: "smokes", label: "Fumo", emoji: "🚬" },
                      ].map((item) => (
                        <View
                          key={item.key}
                          className="w-[48%] flex-row items-center justify-between rounded-[18px] bg-black/20 px-5 py-5"
                        >
                          <Text className="text-[18px] font-medium text-white">
                            {item.emoji} {item.label}
                          </Text>
                          <Switch
                            value={form[item.key as "has_pets" | "smokes"]}
                            onValueChange={(value) =>
                              setForm((current) => ({ ...current, [item.key]: value }))
                            }
                            trackColor={{ false: "#696661", true: "#F36A39" }}
                            thumbColor="#F5F5F5"
                          />
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}

                {currentStep === "photos" ? (
                  <>
                    <Text className="text-[28px] font-extrabold text-white">Pon cara al nombre</Text>
                    <Text className="mt-3 text-[18px] leading-7 text-[#B9B0A9]">
                      Los perfiles con foto reciben 5× más solicitudes
                    </Text>

                    <View className="mt-10 flex-row flex-wrap justify-between gap-y-4">
                      {Array.from({ length: 6 }).map((_, index) => {
                        const photo = form.photos[index];
                        return (
                          <Pressable
                            key={index}
                            onPress={() => pickImage(index)}
                            className={`h-44 w-[31%] items-center justify-center rounded-[18px] border ${
                              photo
                                ? "border-transparent bg-[#D7D0C8]"
                                : "border-dashed border-white/20 bg-black/10"
                            }`}
                          >
                            {photo ? (
                              <>
                                <View className="absolute right-3 top-3">
                                  <Pressable
                                    onPress={() => removePhoto(index)}
                                    className="h-7 w-7 items-center justify-center rounded-full bg-black/40"
                                    hitSlop={8}
                                  >
                                    <Ionicons name="close" size={18} color="#FFFFFF" />
                                  </Pressable>
                                </View>
                                <Text className="text-[12px] text-black/55">Foto añadida</Text>
                              </>
                            ) : (
                              <Ionicons name="add" size={32} color="#AAA29A" />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    <View className="mt-8 rounded-[20px] border border-[#8A452C] bg-[#43352F] px-5 py-5">
                      <Text className="text-[16px] leading-8 text-[#D8CEC7]">
                        💡 Las fotos son tuyas y solo se usan para que tu perfil inspire confianza dentro de tu red.
                      </Text>
                    </View>

                    <Pressable onPress={() => setStep(3)} className="mt-8 self-center">
                      <Text className="text-[16px] text-[#A89F99]">Saltar por ahora</Text>
                    </Pressable>
                  </>
                ) : null}

                {currentStep === "goal" ? (
                  <>
                    <Text className="text-[28px] font-extrabold text-white">¿Qué vas a hacer?</Text>
                    <Text className="mt-3 text-[18px] leading-7 text-[#B9B0A9]">
                      Puedes cambiar esto en cualquier momento
                    </Text>

                    <View className="mt-10 gap-4">
                      {goalCards.map((card) => {
                        const active = form.looking_for === card.value;
                        return (
                          <Pressable
                            key={card.value}
                            onPress={() =>
                              setForm((current) => ({ ...current, looking_for: card.value }))
                            }
                            className={`rounded-[24px] border px-6 py-6 ${
                              active ? "border-[#F36A39] bg-[#453932]" : "border-white/12"
                            }`}
                          >
                            <View className="flex-row items-center">
                              <View className="h-20 w-20 items-center justify-center rounded-[20px] bg-black/20">
                                <Text className="text-[34px]">{card.emoji}</Text>
                              </View>
                              <View className="ml-6 flex-1">
                                <Text
                                  className={`text-[20px] font-bold ${
                                    active ? "text-[#F36A39]" : "text-white"
                                  }`}
                                >
                                  {card.title}
                                </Text>
                                <Text className="mt-2 text-[16px] leading-7 text-[#B9B0A9]">
                                  {card.subtitle}
                                </Text>
                              </View>
                              <View
                                className={`h-11 w-11 items-center justify-center rounded-full border ${
                                  active
                                    ? "border-[#F36A39] bg-[#F36A39]"
                                    : "border-white/25"
                                }`}
                              >
                                {active ? (
                                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                                ) : null}
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                {currentStep === "friendz" ? (
                  <>
                    <Text className="text-[28px] font-extrabold text-white">
                      Conecta con quien conoces
                    </Text>
                    <Text className="mt-3 text-[18px] leading-7 text-[#B9B0A9]">
                      Los anuncios muestran cuántos amigos en común tienes con el publicador. Eso genera confianza.
                    </Text>

                    <Pressable className="mt-10 flex-row items-center rounded-[24px] bg-black/20 px-6 py-6">
                      <View className="h-20 w-20 items-center justify-center rounded-[20px] bg-black/30">
                        <Ionicons name="people-outline" size={34} color="#FFFFFF" />
                      </View>
                      <View className="ml-5 flex-1">
                        <Text className="text-[18px] font-semibold text-white">
                          Importar contactos
                        </Text>
                        <Text className="mt-1 text-[16px] leading-6 text-[#A89F99]">
                          Encuentra a quienes ya conoces
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={28} color="#A89F99" />
                    </Pressable>

                    <Text className="mt-10 text-[14px] font-medium tracking-[1.5px] text-[#C8C1BB]">
                      SUGERENCIAS
                    </Text>

                    <View className="mt-4 gap-4">
                      {loadingSuggestions ? (
                        <View className="items-center py-10">
                          <ActivityIndicator color="#FFFFFF" />
                        </View>
                      ) : (
                        suggestions.map((person, index) => (
                          <View
                            key={person.id}
                            className="flex-row items-center rounded-[20px] bg-black/20 px-5 py-5"
                          >
                            <View
                              className="h-16 w-16 items-center justify-center rounded-full"
                              style={{
                                backgroundColor:
                                  avatarPalette[(index + 1) % avatarPalette.length],
                              }}
                            >
                              <Text className="text-[24px] font-bold text-white">
                                {(person.full_name ?? "?").charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View className="ml-4 flex-1">
                              <Text className="text-[18px] font-semibold text-white">
                                {person.full_name}
                              </Text>
                              <Text className="mt-1 text-[16px] text-[#A89F99]">
                                {person.subtitle}
                              </Text>
                            </View>
                            <Pressable
                              disabled={
                                person.status !== "none" ||
                                (connecting && connectingTo === person.id)
                              }
                              onPress={() => handleConnect(person.id)}
                              className="rounded-[16px] border border-white/25 px-6 py-4"
                            >
                              {connecting && connectingTo === person.id ? (
                                <ActivityIndicator color="#FFFFFF" />
                              ) : (
                                <Text className="text-[16px] font-bold text-white">
                                  {person.status === "accepted"
                                    ? "Conectado"
                                    : person.status === "pending"
                                      ? "Enviado"
                                      : "Conectar"}
                                </Text>
                              )}
                            </Pressable>
                          </View>
                        ))
                      )}
                    </View>

                    <Pressable onPress={() => router.replace("/(tabs)")} className="mt-8 self-center">
                      <Text className="text-[16px] text-[#A89F99]">Saltar, lo hago después</Text>
                    </Pressable>
                  </>
                ) : null}
              </ScrollView>

              <Pressable
                onPress={handleContinue}
                disabled={saving}
                className="mt-5 h-20 items-center justify-center rounded-[18px] border border-white/25"
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-[20px] font-bold text-white">
                    {currentStep === "friendz" ? "Empezar a explorar" : "Continuar"}
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
