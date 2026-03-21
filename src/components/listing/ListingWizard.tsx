import * as Location from "expo-location";
import { router } from "expo-router";
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
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { CitySelector } from "../ui/CitySelector";
import { DistrictSelector } from "../ui/DistrictSelector";
import { locationService, type City, type Place } from "../../services/locationService";
import { PriceTag } from "../ui/PriceTag";
import { TagBadge } from "../ui/TagBadge";
import { useCreateListing } from "../../hooks/useListings";
import { useUpdateListing } from "../../hooks/useListings";
import { pickListingImages, uploadAllListingImages, MAX_IMAGES } from "../../lib/listing-images";
import { useAuth } from "../../providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../theme";
import type { Database } from "../../types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

type FormData = {
  type: "offer" | "search";
  title: string;
  description: string;
  city: string;
  city_id: string | null;
  district: string;
  place_id: string | null;
  price: string;
  size_m2: string;
  rooms: string;
  available_from: string;
  is_furnished: boolean;
  pets_allowed: boolean;
  smokers_allowed: boolean;
  lat: number | null;
  lng: number | null;
};

type Props = {
  initial?: Listing;
};

const EMPTY_FORM: FormData = {
  type: "offer",
  title: "",
  description: "",
  city: "",
  city_id: null,
  district: "",
  place_id: null,
  price: "",
  size_m2: "",
  rooms: "",
  available_from: "",
  is_furnished: false,
  pets_allowed: false,
  smokers_allowed: false,
  lat: null,
  lng: null,
};

function listingToForm(l: Listing): FormData {
  return {
    type: l.type,
    title: l.title,
    description: l.description ?? "",
    city: l.city,
    city_id: l.city_id ?? null,
    district: l.district ?? "",
    place_id: l.place_id ?? null,
    price: l.price.toString(),
    size_m2: l.size_m2?.toString() ?? "",
    rooms: l.rooms?.toString() ?? "",
    available_from: l.available_from ?? "",
    is_furnished: l.is_furnished,
    pets_allowed: l.pets_allowed,
    smokers_allowed: l.smokers_allowed,
    lat: l.lat ?? null,
    lng: l.lng ?? null,
  };
}

export function ListingWizard({ initial }: Props) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? "";
  const isEditing = !!initial;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initial ? listingToForm(initial) : EMPTY_FORM);
  // Durante el wizard: URIs locales. Al enviar se suben.
  const [photoUris, setPhotoUris] = useState<string[]>(initial?.images ?? []);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const createListing = useCreateListing();
  const updateListing = useUpdateListing();

  const set = (key: keyof FormData, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // --- City / District selection ---
  const handleCitySelect = (city: City) => {
    setForm((f) => ({
      ...f,
      city: city.name,
      city_id: city.id,
      district: "",
      place_id: null,
      lat: city.centroid?.lat ?? f.lat,
      lng: city.centroid?.lon ?? f.lng,
    }));
  };

  const handleDistrictSelect = (place: Place) => {
    setForm((f) => ({
      ...f,
      district: place.name,
      place_id: place.id,
      lat: place.centroid?.lat ?? f.lat,
      lng: place.centroid?.lon ?? f.lng,
    }));
  };

  // --- Geocoding ---
  const handleDetectLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Activa la ubicación en los ajustes.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync(pos.coords);
      if (geo?.city) set("city", geo.city);
      setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
    } catch {
      Alert.alert("Error", "No se pudo obtener la ubicación.");
    } finally {
      setLocating(false);
    }
  };

  // --- Fotos ---
  const handleAddPhotos = async () => {
    if (photoUris.length >= MAX_IMAGES) {
      Alert.alert("Límite alcanzado", `Máximo ${MAX_IMAGES} fotos.`);
      return;
    }
    const newUris = await pickListingImages();
    setPhotoUris((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMovePhoto = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= photoUris.length) return;
    setPhotoUris((prev) => {
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr;
    });
  };

  // --- Validación por paso ---
  const validateStep1 = () => {
    if (!form.title.trim()) return "El título es obligatorio.";
    if (!form.city.trim()) return "La ciudad es obligatoria.";
    if (!form.price.trim() || isNaN(Number(form.price))) return "El precio debe ser un número.";
    return null;
  };

  const goNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) { Alert.alert("Datos incompletos", err); return; }
    }
    setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => s - 1);

  // --- Submit ---
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const folder = initial?.id ?? `${Date.now().toString(36)}`;

      // Subir sólo URIs locales (las que no son ya http)
      const localUris = photoUris.filter((u) => !u.startsWith("http"));
      const existingUrls = photoUris.filter((u) => u.startsWith("http"));

      const uploadedUrls = localUris.length > 0
        ? await uploadAllListingImages(userId, folder, localUris)
        : [];

      // Reconstruir array manteniendo orden: existentes primero, luego nuevas
      const allImages = [...existingUrls, ...uploadedUrls];

      const payload = {
        owner_id: userId,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        city: form.city,
        city_id: form.city_id,
        district: form.district.trim() || null,
        place_id: form.place_id,
        price: Number(form.price),
        size_m2: form.size_m2 ? Number(form.size_m2) : null,
        rooms: form.rooms ? Number(form.rooms) : null,
        available_from: form.available_from.trim() || null,
        is_furnished: form.is_furnished,
        pets_allowed: form.pets_allowed,
        smokers_allowed: form.smokers_allowed,
        lat: form.lat,
        lng: form.lng,
        images: allImages,
      };

      if (isEditing && initial) {
        await updateListing.mutateAsync({ id: initial.id, updates: payload });
        router.replace(`/listing/${initial.id}`);
      } else {
        const id = await createListing.mutateAsync(payload);
        router.replace(`/listing/${id}`);
      }
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.progressStep, s <= step && styles.progressStepActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <Step1
            form={form}
            set={set}
            onCitySelect={handleCitySelect}
            onDistrictSelect={handleDistrictSelect}
            onDetectLocation={handleDetectLocation}
            locating={locating}
          />
        )}
        {step === 2 && <Step2 photos={photoUris} onAdd={handleAddPhotos} onRemove={handleRemovePhoto} onMove={handleMovePhoto} />}
        {step === 3 && <Step3 form={form} set={set} photos={photoUris} />}
      </ScrollView>

      {/* Navegación */}
      <View style={styles.nav}>
        {step > 1 ? (
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>← Atrás</Text>
          </Pressable>
        ) : (
          <View />
        )}

        {step < 3 ? (
          <Pressable style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>Siguiente →</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.nextBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.nextBtnText}>{isEditing ? "Guardar cambios" : "Publicar"}</Text>
            }
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Step 1: Lo básico ────────────────────────────────────────────────────────

function Step1({
  form,
  set,
  onCitySelect,
  onDistrictSelect,
  onDetectLocation,
  locating,
}: {
  form: FormData;
  set: (k: keyof FormData, v: string | boolean) => void;
  onCitySelect: (city: City) => void;
  onDistrictSelect: (place: Place) => void;
  onDetectLocation: () => void;
  locating: boolean;
}) {
  return (
    <>
      <Text style={styles.stepTitle}>Lo básico</Text>

      {/* Tipo */}
      <Text style={styles.label}>Tipo de anuncio</Text>
      <View style={styles.typeToggle}>
        <Pressable
          style={[styles.typeBtn, form.type === "offer" && styles.typeBtnActive]}
          onPress={() => set("type", "offer")}
        >
          <Text style={[styles.typeBtnText, form.type === "offer" && styles.typeBtnTextActive]}>
            🏠 Ofrezco habitación
          </Text>
        </Pressable>
        <Pressable
          style={[styles.typeBtn, form.type === "search" && styles.typeBtnActive]}
          onPress={() => set("type", "search")}
        >
          <Text style={[styles.typeBtnText, form.type === "search" && styles.typeBtnTextActive]}>
            🔍 Busco habitación
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        value={form.title}
        onChangeText={(v) => set("title", v)}
        placeholder="Ej: Habitación luminosa en Gràcia"
        maxLength={80}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={form.description}
        onChangeText={(v) => set("description", v)}
        placeholder="Describe el espacio, los compañeros, el ambiente..."
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Ciudad *</Text>
      <CitySelector value={form.city} onSelect={onCitySelect} />
      <Pressable style={styles.locationBtn} onPress={onDetectLocation} disabled={locating}>
        <Text style={styles.locationBtnText}>
          {locating ? "Detectando..." : "📍 Usar mi ubicación"}
        </Text>
      </Pressable>

      <Text style={styles.label}>Barrio / Distrito</Text>
      {form.city_id ? (
        <DistrictSelector
          cityId={form.city_id}
          value={form.district}
          onSelect={onDistrictSelect}
        />
      ) : (
        <TextInput
          style={styles.input}
          value={form.district}
          onChangeText={(v) => set("district", v)}
          placeholder="Selecciona primero una ciudad"
          editable={false}
        />
      )}

      <Text style={styles.label}>Precio (€/mes) *</Text>
      <TextInput
        style={styles.input}
        value={form.price}
        onChangeText={(v) => set("price", v)}
        keyboardType="numeric"
        placeholder="650"
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>m²</Text>
          <TextInput
            style={styles.input}
            value={form.size_m2}
            onChangeText={(v) => set("size_m2", v)}
            keyboardType="numeric"
            placeholder="20"
          />
        </View>
        <View style={{ width: spacing[3] }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Habitaciones</Text>
          <TextInput
            style={styles.input}
            value={form.rooms}
            onChangeText={(v) => set("rooms", v)}
            keyboardType="numeric"
            placeholder="3"
          />
        </View>
      </View>

      <Text style={styles.label}>Disponible desde</Text>
      <TextInput
        style={styles.input}
        value={form.available_from}
        onChangeText={(v) => set("available_from", v)}
        placeholder="2026-04-01"
      />
    </>
  );
}

// ─── Step 2: Fotos ────────────────────────────────────────────────────────────

function Step2({
  photos,
  onAdd,
  onRemove,
  onMove,
}: {
  photos: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
}) {
  return (
    <>
      <Text style={styles.stepTitle}>Fotos</Text>
      <Text style={styles.stepSubtitle}>Hasta {MAX_IMAGES} fotos. La primera será la portada.</Text>

      {photos.map((uri, i) => (
        <View key={uri + i} style={styles.photoRow}>
          <Image source={{ uri }} style={styles.photoThumb} />
          <View style={styles.photoInfo}>
            <Text style={styles.photoIndex}>{i === 0 ? "Portada" : `Foto ${i + 1}`}</Text>
          </View>
          <View style={styles.photoActions}>
            <Pressable onPress={() => onMove(i, -1)} disabled={i === 0} style={styles.photoBtn}>
              <Text style={[styles.photoBtnText, i === 0 && styles.photoBtnDisabled]}>↑</Text>
            </Pressable>
            <Pressable onPress={() => onMove(i, 1)} disabled={i === photos.length - 1} style={styles.photoBtn}>
              <Text style={[styles.photoBtnText, i === photos.length - 1 && styles.photoBtnDisabled]}>↓</Text>
            </Pressable>
            <Pressable onPress={() => onRemove(i)} style={[styles.photoBtn, styles.photoBtnRemove]}>
              <Text style={styles.photoBtnRemoveText}>✕</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {photos.length < MAX_IMAGES && (
        <Pressable style={styles.addPhotoBtn} onPress={onAdd}>
          <Text style={styles.addPhotoBtnText}>＋ Añadir fotos ({photos.length}/{MAX_IMAGES})</Text>
        </Pressable>
      )}

      {photos.length === 0 && (
        <Text style={styles.photoHint}>
          Sin fotos el anuncio tendrá menos visibilidad. ¡Añade al menos una!
        </Text>
      )}
    </>
  );
}

// ─── Step 3: Preferencias + Preview ──────────────────────────────────────────

function Step3({
  form,
  set,
  photos,
}: {
  form: FormData;
  set: (k: keyof FormData, v: string | boolean) => void;
  photos: string[];
}) {
  return (
    <>
      <Text style={styles.stepTitle}>Preferencias</Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🛋️ Amueblado</Text>
        <Switch
          value={form.is_furnished}
          onValueChange={(v) => set("is_furnished", v)}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🐾 Mascotas permitidas</Text>
        <Switch
          value={form.pets_allowed}
          onValueChange={(v) => set("pets_allowed", v)}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🚬 Fumadores permitidos</Text>
        <Switch
          value={form.smokers_allowed}
          onValueChange={(v) => set("smokers_allowed", v)}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {/* Preview */}
      <Text style={[styles.label, { marginTop: spacing[5] }]}>Vista previa</Text>
      <View style={styles.preview}>
        {photos[0] ? (
          <Image source={{ uri: photos[0] }} style={styles.previewImage} />
        ) : (
          <View style={styles.previewImagePlaceholder}>
            <Text style={{ fontSize: 36 }}>🏠</Text>
          </View>
        )}
        <View style={styles.previewBody}>
          <Text style={styles.previewCity}>📍 {form.city || "Ciudad"}</Text>
          <Text style={styles.previewTitle} numberOfLines={2}>
            {form.title || "Título del anuncio"}
          </Text>
          <View style={styles.previewTags}>
            {form.is_furnished && <TagBadge label="Amueblado" variant="primary" />}
            {form.pets_allowed && <TagBadge label="Mascotas OK" variant="success" />}
            {form.smokers_allowed && <TagBadge label="Fumadores OK" variant="warning" />}
          </View>
          {form.price ? (
            <PriceTag amount={Number(form.price)} size="sm" />
          ) : null}
        </View>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: "row",
    gap: spacing[2],
    padding: spacing[4],
    paddingBottom: spacing[2],
    backgroundColor: colors.background,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.gray200,
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  container: {
    padding: spacing[4],
    backgroundColor: colors.background,
    paddingBottom: spacing[6],
  },
  stepTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing[1],
  },
  stepSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[4],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  typeToggle: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  typeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  typeBtnTextActive: {
    color: colors.primary,
  },
  locationBtn: {
    marginTop: spacing[2],
    alignSelf: "flex-start",
  },
  locationBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  // Photos
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[2],
    overflow: "hidden",
  },
  photoThumb: {
    width: 72,
    height: 72,
  },
  photoInfo: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
  photoIndex: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  photoActions: {
    flexDirection: "row",
    paddingRight: spacing[2],
    gap: spacing[1],
  },
  photoBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.gray100,
  },
  photoBtnText: {
    fontSize: 16,
    color: colors.text,
  },
  photoBtnDisabled: {
    color: colors.gray300,
  },
  photoBtnRemove: {
    backgroundColor: colors.errorLight,
  },
  photoBtnRemoveText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: "700",
  },
  addPhotoBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[2],
  },
  addPhotoBtnText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
  photoHint: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing[3],
  },
  // Preferences
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
  },
  toggleLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  // Preview
  preview: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 140,
  },
  previewImagePlaceholder: {
    height: 140,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  previewBody: {
    padding: spacing[3],
    gap: spacing[2],
  },
  previewCity: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  previewTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  previewTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1],
  },
  // Nav
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  backBtnText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    minWidth: 120,
    alignItems: "center",
  },
  nextBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
