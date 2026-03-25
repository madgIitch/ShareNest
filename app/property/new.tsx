import * as Location from "expo-location";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import { CitySelector } from "../../src/components/ui/CitySelector";
import { DistrictSelector } from "../../src/components/ui/DistrictSelector";
import { MiniMapView } from "../../src/components/ui/MiniMapView";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/providers/AuthProvider";
import { locationService, type City, type Place } from "../../src/services/locationService";
import { colors, fontSize, radius, spacing } from "../../src/theme";

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

type PropertyForm = {
  street: string;
  street_number: string;
  city: string;
  city_id: string | null;
  district: string;
  place_id: string | null;
  postal_code: string;
  lat: number | null;
  lng: number | null;
  total_m2: string;
  total_rooms: string;
  floor: string;
  has_elevator: boolean;
  is_furnished: boolean;
  has_balcony: boolean;
  has_parking: boolean;
  has_ac: boolean;
  bills: BillsConfig;
  pets_ok: boolean;
  no_smokers: boolean;
  quiet_hours: boolean;
  no_parties: boolean;
};

const TOTAL_STEPS = 4;
const PROGRESS_COLOR = colors.verify;
const FLOOR_OPTIONS = ["Bajo", "1o", "2o", "3o", "4o+", "Atico"];
const BILL_LABELS: Record<keyof BillsConfig, string> = {
  agua: "Agua",
  luz: "Luz",
  gas: "Gas",
  internet: "Internet",
  limpieza: "Limpieza",
  comunidad: "Comunidad",
  calefaccion: "Calefaccion",
};

const EMPTY_FORM: PropertyForm = {
  street: "",
  street_number: "",
  city: "",
  city_id: null,
  district: "",
  place_id: null,
  postal_code: "",
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
  pets_ok: false,
  no_smokers: false,
  quiet_hours: false,
  no_parties: false,
};

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.gray400}
      keyboardType={keyboardType}
    />
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.verify }} />
    </View>
  );
}

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildHouseRules(form: PropertyForm): string[] | null {
  const rules = [
    form.pets_ok && "mascotas_ok",
    form.no_smokers && "no_fumadores",
    form.quiet_hours && "silencio",
    form.no_parties && "sin_fiestas",
    form.is_furnished && "amueblado",
    form.has_balcony && "balcon_terraza",
    form.has_parking && "parking",
    form.has_ac && "aire_acondicionado",
  ].filter(Boolean) as string[];

  return rules.length > 0 ? rules : null;
}

function nextBillState(state: BillState): BillState {
  if (state === "none") return "included";
  if (state === "included") return "extra";
  return "none";
}

function billStateLabel(state: BillState) {
  if (state === "included") return "Incluido";
  if (state === "extra") return "A parte";
  return "No hay";
}

function billStateStyle(state: BillState) {
  if (state === "included") return styles.billIncluded;
  if (state === "extra") return styles.billExtra;
  return styles.billNone;
}

export default function NewPropertyScreen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id ?? null;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PropertyForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const postalSeq = useRef(0);

  const setField = <K extends keyof PropertyForm>(key: K, value: PropertyForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const hydrateDistrictForCity = async (cityId: string, districtName: string) => {
    if (!districtName.trim()) return;
    try {
      const places = await locationService.getPlaces(cityId, districtName, { limit: 20 });
      const match = places.find((place) => normalizeName(place.name) === normalizeName(districtName)) ?? places[0];
      if (!match) return;
      setForm((prev) => ({
        ...prev,
        district: match.name,
        place_id: match.id,
        lat: match.centroid?.lat ?? prev.lat,
        lng: match.centroid?.lon ?? prev.lng,
      }));
    } catch {
      // ignore best-effort hydration
    }
  };

  const handleCitySelect = (city: City) => {
    setForm((prev) => ({
      ...prev,
      city: city.name,
      city_id: city.id,
      district: "",
      place_id: null,
      lat: city.centroid?.lat ?? prev.lat,
      lng: city.centroid?.lon ?? prev.lng,
    }));
  };

  const hydrateFromPostalCode = async (rawPostal: string) => {
    const postal = rawPostal.replace(/\D/g, "").slice(0, 5);
    setField("postal_code", postal);

    if (postal.length !== 5) return;

    const seq = ++postalSeq.current;
    try {
      const resolved = await locationService.resolvePostalCode(postal, form.city.trim() || null);
      if (!resolved || postalSeq.current !== seq) return;

      const nextForm: Partial<PropertyForm> = {
        postal_code: postal,
        district: resolved.district || form.district,
        lat: resolved.lat,
        lng: resolved.lon,
      };

      let matchedCity: City | null = null;
      if (!form.city_id || normalizeName(form.city) !== normalizeName(resolved.city)) {
        const cities = await locationService.getCities(resolved.city, { limit: 10 });
        matchedCity =
          cities.find((candidate) => normalizeName(candidate.name) === normalizeName(resolved.city))
          ?? cities[0]
          ?? null;
      }

      if (matchedCity) {
        nextForm.city = matchedCity.name;
        nextForm.city_id = matchedCity.id;
        nextForm.lat = matchedCity.centroid?.lat ?? resolved.lat;
        nextForm.lng = matchedCity.centroid?.lon ?? resolved.lon;
        nextForm.place_id = null;
      }

      setForm((prev) => ({ ...prev, ...nextForm }));

      const cityId = matchedCity?.id ?? form.city_id;
      if (cityId && resolved.district) {
        await hydrateDistrictForCity(cityId, resolved.district);
      }
    } catch {
      // ignore best-effort hydration
    }
  };

  const handleDetectLocation = async () => {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permiso denegado", "No hemos podido acceder a tu ubicacion.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [reverse] = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      const cityName = reverse?.city ?? reverse?.subregion ?? "";
      const districtName = reverse?.district ?? reverse?.subLocality ?? "";
      const postalCode = reverse?.postalCode?.replace(/\D/g, "").slice(0, 5) ?? "";
      const street = reverse?.street ?? "";
      const streetNumber = reverse?.streetNumber ?? "";

      let matchedCity: City | null = null;
      if (cityName) {
        const cities = await locationService.getCities(cityName, { limit: 10 });
        matchedCity =
          cities.find((candidate) => normalizeName(candidate.name) === normalizeName(cityName))
          ?? cities[0]
          ?? null;
      }

      setForm((prev) => ({
        ...prev,
        street: street || prev.street,
        street_number: streetNumber || prev.street_number,
        city: matchedCity?.name ?? cityName ?? prev.city,
        city_id: matchedCity?.id ?? prev.city_id,
        district: districtName || prev.district,
        place_id: null,
        postal_code: postalCode || prev.postal_code,
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      }));

      if (matchedCity?.id && districtName) {
        await hydrateDistrictForCity(matchedCity.id, districtName);
      }

      if (postalCode) {
        void hydrateFromPostalCode(postalCode);
      }
    } catch (error) {
      Alert.alert("No se pudo detectar la ubicacion", (error as Error).message);
    } finally {
      setLocating(false);
    }
  };

  const stepValid = useMemo(() => {
    if (step === 1) {
      return !!form.street.trim() && !!form.city.trim() && !!form.city_id;
    }
    if (step === 2) {
      return true;
    }
    if (step === 3) {
      return true;
    }
    return true;
  }, [form.city, form.city_id, form.street, step]);

  const goNext = () => {
    if (!stepValid) {
      Alert.alert("Faltan datos", "Completa los campos obligatorios antes de continuar.");
      return;
    }
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  const goBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert("Sesion no valida", "Vuelve a iniciar sesion e intentalo otra vez.");
      return;
    }

    if (!form.street.trim() || !form.city_id) {
      Alert.alert("Faltan datos", "La direccion y la ciudad son obligatorias.");
      return;
    }

    try {
      setSubmitting(true);
      const { data: property, error } = await supabase
        .from("properties")
        .insert({
          owner_id: userId,
          address: form.street.trim(),
          street_number: form.street_number.trim() || null,
          city_id: form.city_id,
          place_id: form.place_id,
          lat: form.lat,
          lng: form.lng,
          postal_code: form.postal_code.trim() || null,
          floor: form.floor.trim() || null,
          has_elevator: form.has_elevator,
          total_m2: form.total_m2.trim() ? Number(form.total_m2) : null,
          total_rooms: form.total_rooms.trim() ? Number(form.total_rooms) : null,
          images: [],
          bills_config: form.bills,
          house_rules: buildHouseRules(form),
          allows_pets: form.pets_ok,
          allows_smoking: !form.no_smokers,
          has_quiet_hours: form.quiet_hours,
          no_parties: form.no_parties,
          owner_lives_here: false,
        } as never)
        .select("id")
        .single();
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      router.replace({ pathname: "/(tabs)/workspace", params: { propertyId: property.id, tab: "owner" } });
    } catch (error) {
      Alert.alert("No se pudo crear el piso", (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index < step && { backgroundColor: PROGRESS_COLOR },
              ]}
            />
          ))}
        </View>
        <View style={styles.progressMeta}>
          <View style={styles.phasePill}>
            <Text style={styles.phaseText}>El piso</Text>
          </View>
          <Text style={styles.stepCounter}>{step} / {TOTAL_STEPS}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <>
            <Text style={styles.stepTitle}>Donde esta el piso?</Text>
            <Text style={styles.stepSubtitle}>Configura la direccion base del inmueble.</Text>

            <Label>Direccion *</Label>
            <Input value={form.street} onChangeText={(value) => setField("street", value)} placeholder="Calle del Pez" />

            <View style={styles.row}>
              <View style={styles.flex}>
                <Label>Numero</Label>
                <Input value={form.street_number} onChangeText={(value) => setField("street_number", value)} placeholder="14" />
              </View>
              <View style={styles.gap} />
              <View style={styles.flex}>
                <Label>Codigo postal</Label>
                <Input value={form.postal_code} onChangeText={hydrateFromPostalCode} placeholder="28004" keyboardType="numeric" />
              </View>
            </View>

            <Label>Ciudad *</Label>
            <CitySelector value={form.city} onSelect={handleCitySelect} />
            <Pressable style={styles.locationLink} onPress={handleDetectLocation} disabled={locating}>
              <Text style={styles.locationLinkText}>{locating ? "Detectando..." : "Usar mi ubicacion"}</Text>
            </Pressable>

            <Label>Barrio</Label>
            {form.city_id ? (
              <DistrictSelector
                cityId={form.city_id}
                value={form.district}
                onSelect={(place: Place) => {
                  setForm((prev) => ({
                    ...prev,
                    district: place.name,
                    place_id: place.id,
                    lat: place.centroid?.lat ?? prev.lat,
                    lng: place.centroid?.lon ?? prev.lng,
                  }));
                }}
              />
            ) : (
              <Input value={form.district} onChangeText={(value) => setField("district", value)} placeholder="Malasana" />
            )}

            {form.lat != null && form.lng != null ? (
              <View style={styles.mapWrap}>
                <Label>Confirmar en el mapa</Label>
                <MiniMapView lat={form.lat} lng={form.lng} privacyLevel={3} height={180} />
              </View>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.stepTitle}>El piso</Text>
            <Text style={styles.stepSubtitle}>Define los datos generales del inmueble.</Text>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Label>Tamano total (m2)</Label>
                <Input value={form.total_m2} onChangeText={(value) => setField("total_m2", value)} placeholder="70" keyboardType="numeric" />
              </View>
              <View style={styles.gap} />
              <View style={styles.flex}>
                <Label>Habitaciones totales</Label>
                <Input value={form.total_rooms} onChangeText={(value) => setField("total_rooms", value)} placeholder="3" keyboardType="numeric" />
              </View>
            </View>

            <Label>Planta</Label>
            <View style={styles.chipRow}>
              {FLOOR_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.chip, form.floor === option && styles.chipActive]}
                  onPress={() => setField("floor", option)}
                >
                  <Text style={[styles.chipText, form.floor === option && styles.chipTextActive]}>{option}</Text>
                </Pressable>
              ))}
            </View>

            <ToggleRow label="Ascensor" value={form.has_elevator} onChange={(value) => setField("has_elevator", value)} />
            <ToggleRow label="Amueblado" value={form.is_furnished} onChange={(value) => setField("is_furnished", value)} />
            <ToggleRow label="Balcon o terraza" value={form.has_balcony} onChange={(value) => setField("has_balcony", value)} />
            <ToggleRow label="Parking" value={form.has_parking} onChange={(value) => setField("has_parking", value)} />
            <ToggleRow label="Aire acondicionado" value={form.has_ac} onChange={(value) => setField("has_ac", value)} />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.stepTitle}>Gastos</Text>
            <Text style={styles.stepSubtitle}>Que gastos se incluyen en el piso?</Text>

            {(Object.keys(BILL_LABELS) as (keyof BillsConfig)[]).map((key) => (
              <View key={key} style={styles.billRow}>
                <Text style={styles.billLabel}>{BILL_LABELS[key]}</Text>
                <Pressable
                  style={[styles.billState, billStateStyle(form.bills[key])]}
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      bills: { ...prev.bills, [key]: nextBillState(prev.bills[key]) },
                    }))
                  }
                >
                  <Text style={[styles.billStateText, billStateStyle(form.bills[key])]}>{billStateLabel(form.bills[key])}</Text>
                </Pressable>
              </View>
            ))}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={styles.stepTitle}>Normas</Text>
            <Text style={styles.stepSubtitle}>Estas reglas quedan asociadas al piso completo.</Text>

            <ToggleRow label="Mascotas permitidas" value={form.pets_ok} onChange={(value) => setField("pets_ok", value)} />
            <ToggleRow label="No fumadores" value={form.no_smokers} onChange={(value) => setField("no_smokers", value)} />
            <ToggleRow label="Horario de silencio" value={form.quiet_hours} onChange={(value) => setField("quiet_hours", value)} />
            <ToggleRow label="Sin fiestas" value={form.no_parties} onChange={(value) => setField("no_parties", value)} />
          </>
        ) : null}
      </ScrollView>

      <View style={styles.nav}>
        <Pressable style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>{step === 1 ? "Cancelar" : "Atras"}</Text>
        </Pressable>

        {step < TOTAL_STEPS ? (
          <Pressable style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>Siguiente</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.nextBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.nextBtnText}>Crear piso</Text>}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    borderColor: `${PROGRESS_COLOR}55`,
    backgroundColor: `${PROGRESS_COLOR}22`,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
  },
  phaseText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: PROGRESS_COLOR,
  },
  stepCounter: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: "600",
  },
  container: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    backgroundColor: colors.background,
  },
  stepTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  stepSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },
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
  row: {
    flexDirection: "row",
  },
  flex: {
    flex: 1,
  },
  gap: {
    width: spacing[3],
  },
  mapWrap: {
    marginTop: spacing[3],
  },
  locationLink: {
    marginTop: spacing[2],
    alignSelf: "flex-start",
  },
  locationLinkText: {
    color: colors.verify,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[1],
  },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.verify,
    backgroundColor: colors.verifyLight,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.verify,
  },
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
  toggleLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  billRow: {
    marginTop: spacing[2],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  billLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  billState: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
  },
  billStateText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  billIncluded: {
    backgroundColor: colors.successLight,
    borderColor: `${colors.success}66`,
    color: colors.success,
  },
  billExtra: {
    backgroundColor: colors.warningLight,
    borderColor: `${colors.warning}66`,
    color: colors.warning,
  },
  billNone: {
    backgroundColor: colors.gray100,
    borderColor: colors.border,
    color: colors.textSecondary,
  },
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
    paddingHorizontal: spacing[2],
  },
  backBtnText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  nextBtn: {
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    minWidth: 130,
    alignItems: "center",
    backgroundColor: PROGRESS_COLOR,
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
