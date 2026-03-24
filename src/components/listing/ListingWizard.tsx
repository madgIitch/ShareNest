import * as Location from "expo-location";
import { router } from "expo-router";
import { useRef, useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
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
import { MiniMapView } from "../ui/MiniMapView";
import { supabase } from "../../lib/supabase";
import { locationService, type City, type Place } from "../../services/locationService";
import { useCreateListing, useUpdateListing } from "../../hooks/useListings";
import { useMyProperties } from "../../hooks/useProperties";
import { useIsSuperfriendz } from "../../hooks/useSubscription";
import { pickListingImages, uploadAllListingImages, MAX_IMAGES } from "../../lib/listing-images";
import { useAuth } from "../../providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../theme";
import type { Database, BedType, ContractType } from "../../types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];
type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

// ─── Phase / step config ──────────────────────────────────────────────────────

const TOTAL_STEPS = 9;
const phaseColor = (step: number) => {
  if (step <= 5) return colors.verify;   // Azul — datos del piso
  if (step <= 8) return colors.purple;   // Morado — habitación
  return colors.success;                 // Verde — publicar
};
const phaseLabel = (step: number) => {
  if (step <= 5) return "El piso";
  if (step <= 8) return "La habitación";
  return "Publicar";
};

// ─── Form data ────────────────────────────────────────────────────────────────

type BillState = "included" | "extra" | "none";
type BillsConfig = {
  agua: BillState;
  luz: BillState;
  gas: BillState;
  internet: BillState;
  limpieza: BillState;
  comunidad: BillState;
  calefaccion: BillState;
};

type FormData = {
  // Step 1 — Dirección
  street: string;
  street_number: string;
  city: string;
  city_id: string | null;
  postal_code: string;
  district: string;
  place_id: string | null;
  lat: number | null;
  lng: number | null;

  // Step 2 — El piso
  total_m2: string;
  total_rooms: string;
  floor: string;
  has_elevator: boolean;
  is_furnished: boolean;
  has_balcony: boolean;
  has_parking: boolean;
  has_ac: boolean;

  // Step 4 — Gastos
  bills: BillsConfig;

  // Step 5 — Normas
  no_smokers: boolean;
  pets_ok: boolean;
  quiet_hours: boolean;
  no_parties: boolean;

  // Step 6 — Habitación
  title: string;
  size_m2: string;
  bed_type: BedType;
  description: string;
  private_bath: boolean;
  wardrobe: boolean;
  desk: boolean;

  // Step 8 — Precio
  price: string;
  available_from: string;
  min_stay_months: string;
  contract_type: ContractType;
};

const EMPTY_FORM: FormData = {
  street: "",
  street_number: "",
  city: "",
  city_id: null,
  postal_code: "",
  district: "",
  place_id: null,
  lat: null,
  lng: null,
  total_m2: "",
  total_rooms: "",
  floor: "",
  has_elevator: false,
  is_furnished: false,
  has_balcony: false,
  has_parking: false,
  has_ac: false,
  bills: {
    agua: "extra",
    luz: "extra",
    gas: "extra",
    internet: "extra",
    limpieza: "extra",
    comunidad: "extra",
    calefaccion: "extra",
  },
  no_smokers: false,
  pets_ok: false,
  quiet_hours: false,
  no_parties: false,
  title: "",
  size_m2: "",
  bed_type: "double",
  description: "",
  private_bath: false,
  wardrobe: false,
  desk: false,
  price: "",
  available_from: "",
  min_stay_months: "6",
  contract_type: "long_term",
};

function listingToForm(l: Listing): FormData {
  return {
    ...EMPTY_FORM,
    street: l.street ?? "",
    street_number: l.street_number ?? "",
    city: l.city,
    city_id: l.city_id ?? null,
    postal_code: l.postal_code ?? "",
    district: l.district ?? "",
    place_id: l.place_id ?? null,
    lat: l.lat ?? null,
    lng: l.lng ?? null,
    is_furnished: l.is_furnished,
    title: l.title,
    size_m2: l.size_m2?.toString() ?? "",
    bed_type: (l.bed_type as BedType) ?? "double",
    description: l.description ?? "",
    private_bath: l.has_private_bath ?? false,
    wardrobe: l.has_wardrobe ?? false,
    desk: l.has_desk ?? false,
    price: l.price.toString(),
    available_from: l.available_from ?? "",
    min_stay_months: l.min_stay_months?.toString() ?? "6",
    contract_type: (l.contract_type as ContractType) ?? "long_term",
  };
}

const BILL_LABELS: Record<keyof BillsConfig, string> = {
  agua: "Agua",
  luz: "Luz",
  gas: "Gas",
  internet: "Internet",
  limpieza: "Limpieza",
  comunidad: "Comunidad",
  calefaccion: "Calefacción",
};

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fromIsoDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function formatDateForUI(value: string) {
  const d = fromIsoDate(value);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  initial?: Listing;
  startAtStep?: number; // for "add second room" flow starting at step 6
  existingProperty?: PropertyRow | null;
  existingCityName?: string | null;
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Input({ value, onChangeText, placeholder, keyboardType, multiline, numberOfLines }: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.textarea]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.gray400}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? "top" : "center"}
    />
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1Address({
  form, set, onCitySelect, onDistrictSelect, onDetectLocation, locating, onPostalCodeChange,
}: {
  form: FormData;
  set: (k: keyof FormData, v: unknown) => void;
  onCitySelect: (c: City) => void;
  onDistrictSelect: (p: Place) => void;
  onDetectLocation: () => void;
  locating: boolean;
  onPostalCodeChange: (value: string) => void;
}) {
  return (
    <>
      <Text style={styles.stepTitle}>¿Dónde está el piso?</Text>
      <Text style={styles.stepSubtitle}>Esta dirección es privada hasta la asignación.</Text>

      <Label>Dirección</Label>
      <Input
        value={form.street}
        onChangeText={(v) => set("street", v)}
        placeholder="Calle del Pez, 14"
      />

      <Label>Ciudad *</Label>
      <CitySelector value={form.city} onSelect={onCitySelect} />
      <Pressable style={styles.locationLink} onPress={onDetectLocation} disabled={locating}>
        <Text style={styles.locationLinkText}>
          {locating ? "Detectando..." : "📍 Usar mi ubicación"}
        </Text>
      </Pressable>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Label>Código postal</Label>
          <Input
            value={form.postal_code}
            onChangeText={onPostalCodeChange}
            placeholder="28004"
            keyboardType="numeric"
          />
        </View>
        <View style={{ width: spacing[3] }} />
        <View style={{ flex: 1 }}>
          <Label>Barrio</Label>
          {form.city_id ? (
            <DistrictSelector cityId={form.city_id} value={form.district} onSelect={onDistrictSelect} />
          ) : (
            <Input value={form.district} onChangeText={(v) => set("district", v)} placeholder="Malasaña" />
          )}
        </View>
      </View>

      {form.lat != null && form.lng != null && (
        <View style={{ marginTop: spacing[3] }}>
          <Text style={styles.label}>Confirmar en el mapa</Text>
          <MiniMapView lat={form.lat} lng={form.lng} privacyLevel={3} height={180} />
        </View>
      )}
    </>
  );
}

function Step2Piso({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const floors = ["Bajo", "1º", "2º", "3º", "4º+", "Ático"];
  return (
    <>
      <Text style={styles.stepTitle}>Características del piso</Text>
      <Text style={styles.stepSubtitle}>Info compartida entre todas tus habitaciones.</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Label>Tamaño total (m²)</Label>
          <Input value={form.total_m2} onChangeText={(v) => set("total_m2", v)} placeholder="65" keyboardType="numeric" />
        </View>
        <View style={{ width: spacing[3] }} />
        <View style={{ flex: 1 }}>
          <Label>Nº habitaciones</Label>
          <Input value={form.total_rooms} onChangeText={(v) => set("total_rooms", v)} placeholder="3" keyboardType="numeric" />
        </View>
      </View>

      <Label>Planta</Label>
      <View style={styles.chipRow}>
        {floors.map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, form.floor === f && styles.chipActive]}
            onPress={() => set("floor", f)}
          >
            <Text style={[styles.chipText, form.floor === f && styles.chipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <ToggleRow label="Ascensor" value={form.has_elevator} onChange={(v) => set("has_elevator", v)} />
      <ToggleRow label="Amueblado" value={form.is_furnished} onChange={(v) => set("is_furnished", v)} />
      <ToggleRow label="Balcón / terraza" value={form.has_balcony} onChange={(v) => set("has_balcony", v)} />
      <ToggleRow label="Parking" value={form.has_parking} onChange={(v) => set("has_parking", v)} />
      <ToggleRow label="Aire acondicionado" value={form.has_ac} onChange={(v) => set("has_ac", v)} />
    </>
  );
}

function Step3CommonPhotos({
  photos, onAdd, onRemove, onMove,
}: {
  photos: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, d: -1 | 1) => void;
}) {
  return (
    <>
      <Text style={styles.stepTitle}>Fotos del piso</Text>
      <Text style={styles.stepSubtitle}>Salón, cocina, baño, zonas comunes. Mínimo 2.</Text>
      <PhotoList photos={photos} onAdd={onAdd} onRemove={onRemove} onMove={onMove} />
    </>
  );
}

function Step4Bills({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const billItems: { key: keyof BillsConfig; label: string }[] = [
    { key: "agua", label: "Agua" },
    { key: "luz", label: "Luz" },
    { key: "gas", label: "Gas" },
    { key: "internet", label: "Internet" },
    { key: "limpieza", label: "Limpieza" },
    { key: "comunidad", label: "Comunidad" },
    { key: "calefaccion", label: "Calefacción" },
  ];
  return (
    <>
      <Text style={styles.stepTitle}>¿Qué está incluido?</Text>
      <Text style={styles.stepSubtitle}>Los buscadores lo verán antes de solicitar.</Text>
      {billItems.map(({ key, label }) => (
        <View key={key} style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{label}</Text>
          <View style={styles.billOptions}>
            {(
              [
                { value: "included", label: "Incluido" },
                { value: "extra", label: "Aparte" },
                { value: "none", label: "No hay" },
              ] as { value: BillState; label: string }[]
            ).map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.billOption, form.bills[key] === opt.value && styles.billOptionActive]}
                onPress={() => set("bills", { ...form.bills, [key]: opt.value })}
              >
                <Text
                  style={[
                    styles.billOptionText,
                    form.bills[key] === opt.value && styles.billOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

function Step5Rules({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  return (
    <>
      <Text style={styles.stepTitle}>Normas de la casa</Text>
      <Text style={styles.stepSubtitle}>Selecciona las que apliquen.</Text>
      <ToggleRow label="🚭 No fumadores" value={form.no_smokers} onChange={(v) => set("no_smokers", v)} />
      <ToggleRow label="🐾 Mascotas OK" value={form.pets_ok} onChange={(v) => set("pets_ok", v)} />
      <ToggleRow label="🌙 Horas de silencio" value={form.quiet_hours} onChange={(v) => set("quiet_hours", v)} />
      <ToggleRow label="🎉 Sin fiestas" value={!form.no_parties} onChange={(v) => set("no_parties", !v)} />
    </>
  );
}

function Step6Room({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const bedTypes: { key: BedType; label: string }[] = [
    { key: "single", label: "Individual" },
    { key: "double", label: "Doble" },
    { key: "bunk", label: "Litera" },
  ];
  return (
    <>
      <Text style={styles.stepTitle}>Cuéntanos la habitación</Text>
      <Text style={styles.stepSubtitle}>Piso en {form.city || "tu ciudad"}</Text>

      <Label>Título del anuncio *</Label>
      <Input
        value={form.title}
        onChangeText={(v) => set("title", v)}
        placeholder="Habitación luminosa con balcón"
        multiline={false}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Label>Tamaño (m²)</Label>
          <Input value={form.size_m2} onChangeText={(v) => set("size_m2", v)} placeholder="14" keyboardType="numeric" />
        </View>
        <View style={{ width: spacing[3] }} />
        <View style={{ flex: 1 }}>
          <Label>Tipo de cama</Label>
          <View style={styles.chipRow}>
            {bedTypes.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[styles.chip, form.bed_type === key && styles.chipActive]}
                onPress={() => set("bed_type", key)}
              >
                <Text style={[styles.chipText, form.bed_type === key && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Label>Descripción</Label>
      <Input
        value={form.description}
        onChangeText={(v) => set("description", v)}
        placeholder="Luminosa, exterior, da a la calle..."
        multiline
        numberOfLines={3}
      />

      <ToggleRow label="Baño privado" value={form.private_bath} onChange={(v) => set("private_bath", v)} />
      <ToggleRow label="Armario incluido" value={form.wardrobe} onChange={(v) => set("wardrobe", v)} />
      <ToggleRow label="Escritorio" value={form.desk} onChange={(v) => set("desk", v)} />
    </>
  );
}

function Step7RoomPhotos({
  photos, onAdd, onRemove, onMove,
}: {
  photos: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, d: -1 | 1) => void;
}) {
  return (
    <>
      <Text style={styles.stepTitle}>Fotos de la habitación</Text>
      <Text style={styles.stepSubtitle}>Mínimo 1 foto de la habitación.</Text>
      <PhotoList photos={photos} onAdd={onAdd} onRemove={onRemove} onMove={onMove} />
    </>
  );
}

function Step8Price({ form, set }: { form: FormData; set: (k: keyof FormData, v: unknown) => void }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const minStayOptions = [
    { value: "1", label: "1 mes" },
    { value: "3", label: "3 meses" },
    { value: "6", label: "6 meses" },
    { value: "12", label: "1 año" },
    { value: "0", label: "Sin mín." },
  ];
  const contractOptions: { key: ContractType; label: string }[] = [
    { key: "long_term", label: "Largo plazo" },
    { key: "temporary", label: "Temporal" },
    { key: "flexible", label: "Flexible" },
  ];

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      set("available_from", toIsoDate(selectedDate));
    }
  };

  return (
    <>
      <Text style={styles.stepTitle}>Precio y disponibilidad</Text>
      <Text style={styles.stepSubtitle}>Puedes cambiarlo en cualquier momento.</Text>

      <Label>Precio mensual</Label>
      <View style={styles.priceInputWrap}>
        <Text style={styles.pricePrefix}>€</Text>
        <TextInput
          style={styles.priceInput}
          value={form.price}
          onChangeText={(v) => set("price", v)}
          keyboardType="numeric"
          placeholder="750"
          placeholderTextColor={colors.gray400}
        />
        <Text style={styles.priceSuffix}>/mes</Text>
      </View>

      <Label>Disponible desde</Label>
      <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
        <Text style={[styles.dateFieldText, !form.available_from && styles.dateFieldTextPlaceholder]}>
          {form.available_from ? formatDateForUI(form.available_from) : "Seleccionar fecha"}
        </Text>
      </Pressable>
      {showDatePicker && (
        <View style={styles.datePickerWrap}>
          <DateTimePicker
            value={form.available_from ? fromIsoDate(form.available_from) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "calendar"}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
          {Platform.OS === "ios" && (
            <Pressable style={styles.dateDoneBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.dateDoneBtnText}>Listo</Text>
            </Pressable>
          )}
        </View>
      )}

      <Label>Estancia mínima</Label>
      <View style={styles.chipRow}>
        {minStayOptions.map(({ value, label }) => (
          <Pressable
            key={value}
            style={[styles.chip, form.min_stay_months === value && styles.chipActive]}
            onPress={() => set("min_stay_months", value)}
          >
            <Text style={[styles.chipText, form.min_stay_months === value && styles.chipTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Label>Tipo de contrato</Label>
      <View style={styles.chipRow}>
        {contractOptions.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.chip, form.contract_type === key && styles.chipActive]}
            onPress={() => set("contract_type", key)}
          >
            <Text style={[styles.chipText, form.contract_type === key && styles.chipTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function Step9Review({
  form,
  photos,
  onPublish,
  onDraft,
  submitting,
}: {
  form: FormData;
  photos: string[];
  onPublish: () => void;
  onDraft: () => void;
  submitting: boolean;
}) {
  const checklist = [
    { label: "Dirección confirmada", done: !!form.city },
    { label: `Fotos del piso (${photos.length})`, done: photos.length >= 2 },
    { label: "Precio definido", done: !!form.price },
    { label: "Gastos configurados", done: Object.values(form.bills).every(Boolean) },
    { label: "Normas añadidas", done: true },
  ];

  return (
    <>
      <Text style={styles.stepTitle}>¿Todo correcto?</Text>
      <Text style={styles.stepSubtitle}>Así lo verán los buscadores.</Text>

      {/* Preview card */}
      <View style={styles.previewCard}>
        {photos[0] ? (
          <Image source={{ uri: photos[0] }} style={styles.previewImage} />
        ) : (
          <View style={styles.previewImagePlaceholder}>
            <Text style={{ fontSize: 36 }}>🏠</Text>
          </View>
        )}
        <View style={styles.previewBody}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {form.title || "Título del anuncio"}
          </Text>
          <Text style={styles.previewMeta}>
            {form.price ? `${form.price} €/mes` : "—"} · {form.city || "Ciudad"} · {form.size_m2 ? `${form.size_m2} m²` : "—"}
          </Text>
          <View style={styles.previewTags}>
            {form.min_stay_months && form.min_stay_months !== "0" && (
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>{form.min_stay_months} meses mín.</Text>
              </View>
            )}
            {Object.entries(form.bills)
              .filter(([, state]) => state === "included")
              .slice(0, 3)
              .map(([key]) => (
                <View key={key} style={styles.previewTag}>
                  <Text style={styles.previewTagText}>
                    {BILL_LABELS[key as keyof BillsConfig]} incl.
                  </Text>
                </View>
              ))}
          </View>
        </View>
      </View>

      {/* Checklist */}
      <View style={styles.checklist}>
        <Text style={styles.checklistTitle}>CHECKLIST DE PUBLICACIÓN</Text>
        {checklist.map(({ label, done }) => (
          <View key={label} style={styles.checklistItem}>
            <Text style={[styles.checklistIcon, done ? styles.checkDone : styles.checkMissing]}>
              {done ? "✓" : "○"}
            </Text>
            <Text style={[styles.checklistLabel, !done && styles.checklistLabelMissing]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Privacy callout */}
      <View style={styles.privacyCallout}>
        <Text style={styles.privacyCalloutIcon}>△</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyCalloutTitle}>Dirección privada hasta asignación</Text>
          <Text style={styles.privacyCalloutText}>
            Los buscadores verán la zona, no la calle.
          </Text>
        </View>
      </View>
    </>
  );
}

// ─── Photo list shared component ──────────────────────────────────────────────

function PhotoList({
  photos, onAdd, onRemove, onMove,
}: {
  photos: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, d: -1 | 1) => void;
}) {
  return (
    <>
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
            <Pressable
              onPress={() => onMove(i, 1)}
              disabled={i === photos.length - 1}
              style={styles.photoBtn}
            >
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
    </>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function ListingWizard({ initial, startAtStep = 1, existingProperty = null, existingCityName = null }: Props) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? "";
  const isEditing = !!initial;
  const { data: isSuper = false, isLoading: isSuperLoading } = useIsSuperfriendz();
  const { data: myProperties = [] } = useMyProperties(userId || undefined);

  const [step, setStep] = useState(startAtStep);
  const [form, setForm] = useState<FormData>(() => {
    if (initial) return listingToForm(initial);
    if (!existingProperty) return EMPTY_FORM;

    const billsRaw = (existingProperty.bills_config ?? {}) as Partial<BillsConfig>;
    const existingBills: BillsConfig = {
      agua: billsRaw.agua ?? "extra",
      luz: billsRaw.luz ?? "extra",
      gas: billsRaw.gas ?? "extra",
      internet: billsRaw.internet ?? "extra",
      limpieza: billsRaw.limpieza ?? "extra",
      comunidad: billsRaw.comunidad ?? "extra",
      calefaccion: billsRaw.calefaccion ?? "extra",
    };
    const rules = existingProperty.house_rules ?? [];

    return {
      ...EMPTY_FORM,
      street: existingProperty.address ?? "",
      street_number: existingProperty.street_number ?? "",
      city: existingCityName ?? "",
      city_id: existingProperty.city_id,
      district: "",
      place_id: existingProperty.place_id,
      lat: existingProperty.lat,
      lng: existingProperty.lng,
      postal_code: existingProperty.postal_code ?? "",
      total_m2: existingProperty.total_m2 != null ? String(existingProperty.total_m2) : "",
      total_rooms: existingProperty.total_rooms != null ? String(existingProperty.total_rooms) : "",
      floor: existingProperty.floor ?? "",
      has_elevator: existingProperty.has_elevator,
      bills: existingBills,
      no_smokers: rules.includes("no_fumadores"),
      pets_ok: rules.includes("mascotas_ok"),
      quiet_hours: rules.includes("silencio"),
      no_parties: rules.includes("sin_fiestas"),
    };
  });
  const [photoUris, setPhotoUris] = useState<string[]>(initial?.images ?? (existingProperty?.images as string[] | undefined) ?? []);
  const [roomPhotoUris, setRoomPhotoUris] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const geoSyncSeq = useRef(0);

  const createListing = useCreateListing();
  const updateListing = useUpdateListing();

  const set = (key: keyof FormData, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // ── City / District selection ──
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

  const pickCityFromName = async (rawCity: string) => {
    const cityName = rawCity.trim();
    if (!cityName) return null;
    const cities = await locationService.getCities(cityName, { limit: 8 });
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    const target = normalize(cityName);
    return (
      cities.find((c) => normalize(c.name) === target)
      ?? cities.find((c) => normalize(c.name).includes(target))
      ?? cities[0]
      ?? null
    );
  };

  const syncPostalFromCityAndDistrict = (cityName: string, districtName: string, streetName: string) => {
    const city = cityName.trim();
    const district = districtName.trim();
    if (!city || !district) return;
    const seq = ++geoSyncSeq.current;
    void (async () => {
      try {
        const query = [streetName.trim(), district, city].filter(Boolean).join(", ");
        const [geoPoint] = await Location.geocodeAsync(query);
        if (!geoPoint || seq !== geoSyncSeq.current) return;
        const [rev] = await Location.reverseGeocodeAsync({
          latitude: geoPoint.latitude,
          longitude: geoPoint.longitude,
        });
        const detectedPostal = rev?.postalCode?.trim();
        if (!detectedPostal || seq !== geoSyncSeq.current) return;
        setForm((f) => ({ ...f, postal_code: detectedPostal }));
      } catch {
        // Best effort.
      }
    })();
  };

  const syncFromPostalCode = (rawPostal: string) => {
    const postal = rawPostal.replace(/\D/g, "").slice(0, 5);
    set("postal_code", postal);
    if (postal.length !== 5) return;

    const seq = ++geoSyncSeq.current;
    void (async () => {
      try {
        const query = [postal, form.city?.trim() || "Espana"].filter(Boolean).join(", ");
        const [geoPoint] = await Location.geocodeAsync(query);
        if (!geoPoint || seq !== geoSyncSeq.current) return;

        const [rev] = await Location.reverseGeocodeAsync({
          latitude: geoPoint.latitude,
          longitude: geoPoint.longitude,
        });
        if (!rev || seq !== geoSyncSeq.current) return;

        const inferredCityName = rev.city?.trim() || form.city?.trim() || "";
        const inferredDistrict = rev.district?.trim() || rev.subregion?.trim() || "";
        const matchedCity = inferredCityName ? await pickCityFromName(inferredCityName) : null;
        if (seq !== geoSyncSeq.current) return;

        setForm((f) => ({
          ...f,
          postal_code: postal,
          city: (matchedCity?.name ?? inferredCityName) || f.city,
          city_id: matchedCity?.id ?? f.city_id,
          district: inferredDistrict || f.district,
          place_id: null,
          lat: geoPoint.latitude ?? f.lat,
          lng: geoPoint.longitude ?? f.lng,
        }));

        if (matchedCity?.id && inferredDistrict) {
          const places = await locationService.getPlaces(matchedCity.id, inferredDistrict, { limit: 12 });
          if (seq !== geoSyncSeq.current) return;
          const normalize = (s: string) =>
            s
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
          const target = normalize(inferredDistrict);
          const best =
            places.find((p) => normalize(p.name) === target)
            ?? places.find((p) => normalize(p.name).includes(target))
            ?? null;
          if (best) {
            setForm((f) => ({
              ...f,
              district: best.name,
              place_id: best.id,
              city_id: best.city_id || f.city_id,
              lat: best.centroid?.lat ?? f.lat,
              lng: best.centroid?.lon ?? f.lng,
            }));
          }
        }
      } catch {
        // Best effort sync.
      }
    })();
  };

  const handleDistrictSelect = (place: Place) => {
    const nextLat = place.centroid?.lat ?? null;
    const nextLng = place.centroid?.lon ?? null;
    const streetForLookup = form.street.trim();
    const cityForLookup = form.city.trim();

    setForm((f) => ({
      ...f,
      district: place.name,
      place_id: place.id,
      city_id: place.city_id || f.city_id,
      lat: nextLat ?? f.lat,
      lng: nextLng ?? f.lng,
    }));
    syncPostalFromCityAndDistrict(cityForLookup, place.name, streetForLookup);
  };

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

  // ── Photos ──
  const handleAddPhotos = async () => {
    if (photoUris.length >= MAX_IMAGES) return;
    const uris = await pickListingImages();
    setPhotoUris((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
  };

  const handleAddRoomPhotos = async () => {
    if (roomPhotoUris.length >= MAX_IMAGES) return;
    const uris = await pickListingImages();
    setRoomPhotoUris((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
  };

  // ── Validation ──
  const validateStep = (): string | null => {
    if (step === 1 && !form.city.trim()) return "La ciudad es obligatoria.";
    if (step === 6 && !form.title.trim()) return "El título es obligatorio.";
    if (step === 8 && (!form.price.trim() || isNaN(Number(form.price)))) {
      return "El precio debe ser un número.";
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep();
    if (err) { Alert.alert("Datos incompletos", err); return; }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── Submit ──
  const handleSubmit = async (asDraft = false) => {
    try {
      setSubmitting(true);
      const folder = initial?.id ?? `${Date.now().toString(36)}`;

      const localUris = photoUris.filter((u) => !u.startsWith("http"));
      const existingUrls = photoUris.filter((u) => u.startsWith("http"));
      const uploadedUrls = localUris.length > 0
        ? await uploadAllListingImages(userId, folder, localUris)
        : [];
      const allImages = [...existingUrls, ...uploadedUrls, ...roomPhotoUris];

      const houseRules: string[] = [
        form.no_smokers && "no_fumadores",
        form.pets_ok && "mascotas_ok",
        form.quiet_hours && "silencio",
        form.no_parties && "sin_fiestas",
      ].filter(Boolean) as string[];

      const propertyPayload: PropertyInsert = {
        owner_id: userId,
        address: form.street.trim() || `${form.city} ${form.district}`.trim(),
        street_number: form.street_number.trim() || null,
        city_id: form.city_id,
        place_id: form.place_id,
        lat: form.lat,
        lng: form.lng,
        postal_code: form.postal_code.trim() || null,
        floor: form.floor.trim() || null,
        has_elevator: form.has_elevator,
        total_m2: form.total_m2 ? Number(form.total_m2) : null,
        total_rooms: form.total_rooms ? Number(form.total_rooms) : null,
        images: photoUris,
        bills_config: form.bills,
        house_rules: houseRules,
      };

      let propertyId: string | null = initial?.property_id ?? existingProperty?.id ?? null;
      const canEditPropertyBlock = isEditing || startAtStep <= 5;

      if (!propertyId && !isSuper) {
        if (isSuperLoading) throw new Error("Cargando tu plan. Intenta de nuevo en unos segundos.");
        if ((myProperties ?? []).length >= 1) {
          throw new Error("En plan free solo puedes tener 1 piso. Crea nuevas habitaciones dentro de tu piso actual.");
        }
      }

      if (propertyId && canEditPropertyBlock) {
        const propertyUpdates: PropertyUpdate = {
          address: propertyPayload.address,
          street_number: propertyPayload.street_number,
          floor: propertyPayload.floor,
          has_elevator: propertyPayload.has_elevator,
          total_m2: propertyPayload.total_m2,
          total_rooms: propertyPayload.total_rooms,
          images: propertyPayload.images,
          bills_config: propertyPayload.bills_config,
          house_rules: propertyPayload.house_rules,
        };
        const { error: propertyUpdateError } = await supabase
          .from("properties")
          .update(propertyUpdates)
          .eq("id", propertyId)
          .eq("owner_id", userId);
        if (propertyUpdateError) throw propertyUpdateError;
      } else {
        const { data: property, error: propertyInsertError } = await supabase
          .from("properties")
          .insert(propertyPayload)
          .select("id")
          .single();
        if (propertyInsertError) throw propertyInsertError;
        propertyId = property.id;
      }

      const payload = {
        owner_id: userId,
        property_id: propertyId,
        type: "offer" as const,
        title: form.title.trim(),
        description: form.description.trim() || null,
        city: form.city || existingCityName || "Ciudad",
        city_id: form.city_id,
        district: form.district.trim() || null,
        place_id: form.place_id,
        street: form.street.trim() || null,
        street_number: form.street_number.trim() || null,
        postal_code: form.postal_code.trim() || null,
        price: Number(form.price),
        size_m2: form.size_m2 ? Number(form.size_m2) : null,
        rooms: form.total_rooms ? Number(form.total_rooms) : null,
        available_from: form.available_from.trim() || null,
        is_furnished: form.is_furnished,
        pets_allowed: form.pets_ok,
        smokers_allowed: !form.no_smokers,
        lat: form.lat,
        lng: form.lng,
        images: allImages,
        status: asDraft ? ("draft" as const) : ("active" as const),
        // New fields (gracefully ignored if column doesn't exist yet)
        min_stay_months: form.min_stay_months ? Number(form.min_stay_months) : null,
        contract_type: form.contract_type,
        bed_type: form.bed_type,
        has_private_bath: form.private_bath,
        has_wardrobe: form.wardrobe,
        has_desk: form.desk,
      };

      if (isEditing && initial) {
        await updateListing.mutateAsync({ id: initial.id, updates: payload });
        router.replace(`/listing/${initial.id}`);
      } else {
        const newId = await createListing.mutateAsync(payload);
        router.replace(`/listing/${newId}`);
      }
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Phase color ──
  const pc = phaseColor(step);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                i < step && { backgroundColor: pc },
              ]}
            />
          ))}
        </View>
        <View style={styles.progressMeta}>
          <View style={[styles.phasePill, { backgroundColor: pc + "22", borderColor: pc + "55" }]}>
            <Text style={[styles.phaseText, { color: pc }]}>{phaseLabel(step)}</Text>
          </View>
          <Text style={styles.stepCounter}>{step} / {TOTAL_STEPS}</Text>
        </View>
      </View>

      {/* Step content */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <Step1Address
            form={form}
            set={set}
            onCitySelect={handleCitySelect}
            onDistrictSelect={handleDistrictSelect}
            onDetectLocation={handleDetectLocation}
            locating={locating}
            onPostalCodeChange={syncFromPostalCode}
          />
        )}
        {step === 2 && <Step2Piso form={form} set={set} />}
        {step === 3 && (
          <Step3CommonPhotos
            photos={photoUris}
            onAdd={handleAddPhotos}
            onRemove={(i) => setPhotoUris((p) => p.filter((_, idx) => idx !== i))}
            onMove={(i, d) => setPhotoUris((p) => {
              const arr = [...p];
              const next = i + d;
              if (next < 0 || next >= arr.length) return arr;
              [arr[i], arr[next]] = [arr[next], arr[i]];
              return arr;
            })}
          />
        )}
        {step === 4 && <Step4Bills form={form} set={set} />}
        {step === 5 && <Step5Rules form={form} set={set} />}
        {step === 6 && <Step6Room form={form} set={set} />}
        {step === 7 && (
          <Step7RoomPhotos
            photos={roomPhotoUris}
            onAdd={handleAddRoomPhotos}
            onRemove={(i) => setRoomPhotoUris((p) => p.filter((_, idx) => idx !== i))}
            onMove={(i, d) => setRoomPhotoUris((p) => {
              const arr = [...p];
              const next = i + d;
              if (next < 0 || next >= arr.length) return arr;
              [arr[i], arr[next]] = [arr[next], arr[i]];
              return arr;
            })}
          />
        )}
        {step === 8 && <Step8Price form={form} set={set} />}
        {step === 9 && (
          <Step9Review
            form={form}
            photos={[...photoUris, ...roomPhotoUris]}
            onPublish={() => handleSubmit(false)}
            onDraft={() => handleSubmit(true)}
            submitting={submitting}
          />
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.nav}>
        {step > 1 ? (
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>← Atrás</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>✕ Cancelar</Text>
          </Pressable>
        )}

        {step < 9 ? (
          <Pressable style={[styles.nextBtn, { backgroundColor: pc }]} onPress={goNext}>
            <Text style={styles.nextBtnText}>Siguiente →</Text>
          </Pressable>
        ) : (
          <View style={styles.publishRow}>
            <Pressable style={styles.draftBtn} onPress={() => handleSubmit(true)} disabled={submitting}>
              <Text style={styles.draftBtnText}>Guardar borrador</Text>
            </Pressable>
            <Pressable
              style={[styles.nextBtn, { backgroundColor: colors.success }, submitting && styles.btnDisabled]}
              onPress={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.nextBtnText}>Publicar anuncio</Text>
              }
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Progress
  progressWrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[2],
  },
  progressBar: {
    flexDirection: "row",
    gap: 3,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.gray200,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phasePill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
  },
  phaseText: { fontSize: fontSize.xs, fontWeight: "700" },
  stepCounter: { fontSize: fontSize.xs, color: colors.textTertiary, fontWeight: "600" },

  // Container
  container: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    backgroundColor: colors.background,
    gap: spacing[1],
  },

  // Step headings
  stepTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing[1],
    marginTop: spacing[2],
  },
  stepSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },

  // Form elements
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.gray700,
    marginBottom: spacing[1],
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
  textarea: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row" },

  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginTop: 2 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: colors.primary },

  // Toggle
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
    marginTop: spacing[2],
  },
  toggleLabel: { fontSize: fontSize.md, color: colors.text, flex: 1 },
  billOptions: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  billOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  billOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  billOptionText: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
  billOptionTextActive: { color: colors.primary },

  // Price input
  priceInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
  },
  pricePrefix: { fontSize: fontSize["2xl"], color: colors.textSecondary, fontWeight: "700" },
  priceInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: "800",
    color: colors.text,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  priceSuffix: { fontSize: fontSize.md, color: colors.textSecondary },
  dateField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
  },
  dateFieldText: { fontSize: fontSize.md, color: colors.text, fontWeight: "600" },
  dateFieldTextPlaceholder: { color: colors.textSecondary, fontWeight: "400" },
  datePickerWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing[2],
    overflow: "hidden",
  },
  dateDoneBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginBottom: spacing[1],
    marginRight: spacing[1],
  },
  dateDoneBtnText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "700" },

  // Location link
  locationLink: { marginTop: spacing[2], alignSelf: "flex-start" },
  locationLinkText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "600" },

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
  photoThumb: { width: 72, height: 72 },
  photoInfo: { flex: 1, paddingHorizontal: spacing[3] },
  photoIndex: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
  photoActions: { flexDirection: "row", paddingRight: spacing[2], gap: spacing[1] },
  photoBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.gray100,
  },
  photoBtnText: { fontSize: 16, color: colors.text },
  photoBtnDisabled: { color: colors.gray300 },
  photoBtnRemove: { backgroundColor: colors.errorLight },
  photoBtnRemoveText: { fontSize: 14, color: colors.error, fontWeight: "700" },
  addPhotoBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[2],
  },
  addPhotoBtnText: { color: colors.primary, fontWeight: "600", fontSize: fontSize.md },

  // Review
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginTop: spacing[3],
  },
  previewImage: { width: "100%", height: 140 },
  previewImagePlaceholder: {
    height: 140,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  previewBody: { padding: spacing[3], gap: spacing[2] },
  previewTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  previewMeta: { fontSize: fontSize.xs, color: colors.textSecondary },
  previewTags: { flexDirection: "row", flexWrap: "wrap", gap: spacing[1] },
  previewTag: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  previewTagText: { fontSize: 11, color: colors.textSecondary },

  checklist: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[2],
    marginTop: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  checklistTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  checklistItem: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  checklistIcon: { fontSize: fontSize.md, fontWeight: "700" },
  checkDone: { color: colors.success },
  checkMissing: { color: colors.gray300 },
  checklistLabel: { fontSize: fontSize.sm, color: colors.text },
  checklistLabelMissing: { color: colors.textSecondary },

  privacyCallout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    backgroundColor: colors.warningLight,
    borderRadius: radius.xl,
    padding: spacing[3],
    marginTop: spacing[3],
    borderWidth: 1,
    borderColor: colors.warning + "44",
  },
  privacyCalloutIcon: { fontSize: fontSize.lg, color: colors.warning },
  privacyCalloutTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.warning },
  privacyCalloutText: { fontSize: fontSize.xs, color: colors.warning, opacity: 0.8, marginTop: 2 },

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
  backBtn: { paddingVertical: spacing[3], paddingHorizontal: spacing[2] },
  backBtnText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: "600" },
  nextBtn: {
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    minWidth: 130,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  nextBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  publishRow: { flexDirection: "row", gap: spacing[2] },
  draftBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  draftBtnText: { fontWeight: "600", color: colors.textSecondary, fontSize: fontSize.sm },
  btnDisabled: { opacity: 0.6 },
});
