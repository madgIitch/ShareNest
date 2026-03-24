import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../../src/theme";
import { useProperty, useUpdateProperty } from "../../../src/hooks/useProperties";
import { LocationPickerMap } from "../../../src/components/ui/LocationPickerMap";
import type { Json } from "../../../src/types/database";

type BillsKey = "agua" | "luz" | "gas" | "internet" | "limpieza" | "comunidad" | "calefaccion";
type BillsMode = "included" | "separate" | "none";
type BillsForm = Record<BillsKey, BillsMode>;
type HouseRuleLabel =
  | "Mascotas OK"
  | "Silencio a partir de las 23h"
  | "No fumar"
  | "Sin fiestas"
  | "Limpieza por turnos"
  | "Aviso con 30 dias";

const BILL_LABELS: Record<BillsKey, string> = {
  agua: "Agua",
  luz: "Luz",
  gas: "Gas",
  internet: "Internet",
  limpieza: "Limpieza",
  comunidad: "Comunidad",
  calefaccion: "Calefaccion",
};

const DEFAULT_BILLS: BillsForm = {
  agua: "none",
  luz: "none",
  gas: "none",
  internet: "none",
  limpieza: "none",
  comunidad: "none",
  calefaccion: "none",
};

const HOUSE_RULE_OPTIONS: HouseRuleLabel[] = [
  "Mascotas OK",
  "Silencio a partir de las 23h",
  "No fumar",
  "Sin fiestas",
  "Limpieza por turnos",
  "Aviso con 30 dias",
];

function normalizeHouseRule(raw: string): HouseRuleLabel | string {
  const v = raw.trim().toLowerCase().replace(/[_-]/g, " ");
  if (!v) return raw;
  if (v.includes("mascota")) return "Mascotas OK";
  if (v.includes("silencio") || v.includes("23")) return "Silencio a partir de las 23h";
  if (v.includes("no fumar") || v.includes("fumar")) return "No fumar";
  if (v.includes("fiesta")) return "Sin fiestas";
  if (v.includes("limpieza") || v.includes("turno")) return "Limpieza por turnos";
  if ((v.includes("aviso") && v.includes("30")) || v.includes("dias")) return "Aviso con 30 dias";
  return raw.trim();
}

function parseBills(raw: Json | null): BillsForm {
  const parsed = { ...DEFAULT_BILLS };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return parsed;
  for (const key of Object.keys(DEFAULT_BILLS) as BillsKey[]) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === true) parsed[key] = "included";
    else if (value === "included" || value === "separate" || value === "none") parsed[key] = value;
  }
  return parsed;
}

function serializeBills(form: BillsForm): Record<BillsKey, BillsMode> {
  return { ...form };
}

function nextMode(mode: BillsMode): BillsMode {
  if (mode === "none") return "included";
  if (mode === "included") return "separate";
  return "none";
}

function modeLabel(mode: BillsMode) {
  if (mode === "included") return "incluido";
  if (mode === "separate") return "a parte";
  return "no hay";
}

function modePillStyle(mode: BillsMode) {
  if (mode === "included") {
    return { backgroundColor: colors.successLight, borderColor: colors.success + "66", color: colors.success };
  }
  if (mode === "separate") {
    return { backgroundColor: colors.warningLight, borderColor: colors.warning + "66", color: colors.warning };
  }
  return { backgroundColor: colors.gray100, borderColor: colors.border, color: colors.textSecondary };
}

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;

  const { data: property, isLoading } = useProperty(id);
  const updateProperty = useUpdateProperty();

  const [address, setAddress] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [floor, setFloor] = useState("");
  const [totalM2, setTotalM2] = useState("");
  const [totalRooms, setTotalRooms] = useState("");
  const [hasElevator, setHasElevator] = useState(false);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [customRuleDraft, setCustomRuleDraft] = useState("");
  const [bills, setBills] = useState<BillsForm>(DEFAULT_BILLS);

  useEffect(() => {
    if (!property) return;
    setAddress(property.address ?? "");
    setStreetNumber(property.street_number ?? "");
    setPostalCode(property.postal_code ?? "");
    setLat(property.lat ?? null);
    setLng(property.lng ?? null);
    setFloor(property.floor ?? "");
    setTotalM2(property.total_m2 != null ? String(property.total_m2) : "");
    setTotalRooms(property.total_rooms != null ? String(property.total_rooms) : "");
    setHasElevator(!!property.has_elevator);
    setSelectedRules(
      Array.from(
        new Set((property.house_rules ?? []).map((rule) => normalizeHouseRule(rule)).filter(Boolean)),
      ),
    );
    setBills(parseBills(property.bills_config));
  }, [property]);

  const canSave = useMemo(() => !!address.trim() && !!property && !updateProperty.isPending, [address, property, updateProperty.isPending]);
  const customRules = useMemo(
    () => selectedRules.filter((rule) => !HOUSE_RULE_OPTIONS.includes(rule as HouseRuleLabel)),
    [selectedRules],
  );

  const addCustomRule = () => {
    const next = customRuleDraft.trim();
    if (!next) return;
    const exists = selectedRules.some((r) => r.toLowerCase() === next.toLowerCase());
    if (exists) {
      setCustomRuleDraft("");
      return;
    }
    setSelectedRules((prev) => [...prev, next]);
    setCustomRuleDraft("");
  };

  const onSave = async () => {
    if (!property || !canSave) return;
    await updateProperty.mutateAsync({
      id: property.id,
      ownerId: myId,
      updates: {
        address: address.trim(),
        street_number: streetNumber.trim() || null,
        postal_code: postalCode.trim() || null,
        lat,
        lng,
        floor: floor.trim() || null,
        total_m2: totalM2.trim() ? Number(totalM2) : null,
        total_rooms: totalRooms.trim() ? Number(totalRooms) : null,
        has_elevator: hasElevator,
        house_rules: selectedRules.length > 0 ? selectedRules : null,
        bills_config: serializeBills(bills),
      },
    });

    if (typeof router.canGoBack === "function" && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(`/(tabs)/property/${property.id}`);
  };

  if (isLoading || !property) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace(`/(tabs)/property/${property.id}`))}>
          <Text style={styles.back}>Atras</Text>
        </Pressable>
        <Text style={styles.title}>Editar piso</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Ubicacion del piso</Text>
          <Text style={styles.fieldLabel}>Calle</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Nombre de la via (ej. Calle del Pez)"
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>Numero de portal</Text>
              <TextInput
                style={styles.input}
                value={streetNumber}
                onChangeText={setStreetNumber}
                placeholder="Ej. 14"
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>Codigo postal</Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Ej. 41002"
              />
            </View>
          </View>
          {lat != null && lng != null ? (
            <View style={{ marginTop: spacing[2], gap: spacing[2] }}>
              <Text style={styles.fieldLabel}>Confirmacion en mapa</Text>
              <LocationPickerMap
                lat={lat}
                lng={lng}
                height={190}
                onChange={({ lat: nextLat, lng: nextLng }) => {
                  setLat(nextLat);
                  setLng(nextLng);
                }}
              />
              <Text style={styles.hint}>
                Pin actual: {lat.toFixed(6)}, {lng.toFixed(6)}
              </Text>
            </View>
          ) : (
            <Text style={styles.hint}>Este piso no tiene coordenadas guardadas todavia.</Text>
          )}
          <TextInput style={styles.input} value={floor} onChangeText={setFloor} placeholder="Planta / puerta" />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Datos del piso</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex]}
              value={totalM2}
              onChangeText={setTotalM2}
              placeholder="65"
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              value={totalRooms}
              onChangeText={setTotalRooms}
              placeholder="3"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Tiene ascensor</Text>
            <Switch value={hasElevator} onValueChange={setHasElevator} />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Gastos del piso</Text>
          {(Object.keys(BILL_LABELS) as BillsKey[]).map((key) => (
            <Pressable
              key={key}
              style={styles.billRow}
              onPress={() => setBills((prev) => ({ ...prev, [key]: nextMode(prev[key]) }))}
            >
              <Text style={styles.billLabel}>{BILL_LABELS[key]}</Text>
              <View
                style={[
                  styles.billModePill,
                  {
                    backgroundColor: modePillStyle(bills[key]).backgroundColor,
                    borderColor: modePillStyle(bills[key]).borderColor,
                  },
                ]}
              >
                <Text style={[styles.billMode, { color: modePillStyle(bills[key]).color }]}>
                  {modeLabel(bills[key])}
                </Text>
              </View>
            </Pressable>
          ))}
          <Text style={styles.hint}>Pulsa cada gasto para alternar: incluido, a parte o no hay.</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Normas de casa</Text>
          <Text style={styles.hint}>Selecciona las normas que aplican al piso.</Text>
          <View style={styles.rulesWrap}>
            {HOUSE_RULE_OPTIONS.map((rule) => {
              const active = selectedRules.includes(rule);
              return (
                <Pressable
                  key={rule}
                  style={[styles.ruleChip, active && styles.ruleChipActive]}
                  onPress={() =>
                    setSelectedRules((prev) =>
                      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule],
                    )
                  }
                >
                  <Text style={[styles.ruleChipText, active && styles.ruleChipTextActive]}>{rule}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.fieldLabel, { marginTop: spacing[2] }]}>Norma personalizada</Text>
          <View style={styles.customRuleRow}>
            <TextInput
              style={[styles.input, styles.flex]}
              value={customRuleDraft}
              onChangeText={setCustomRuleDraft}
              placeholder="Ej. No dejar bicis en el pasillo"
              returnKeyType="done"
              onSubmitEditing={addCustomRule}
            />
            <Pressable style={styles.customRuleAddBtn} onPress={addCustomRule}>
              <Text style={styles.customRuleAddBtnText}>Anadir</Text>
            </Pressable>
          </View>
          {customRules.length > 0 && (
            <View style={styles.rulesWrap}>
              {customRules.map((rule) => (
                <Pressable
                  key={rule}
                  style={styles.customRuleChip}
                  onPress={() => setSelectedRules((prev) => prev.filter((r) => r !== rule))}
                >
                  <Text style={styles.customRuleChipText}>{rule} x</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace(`/(tabs)/property/${property.id}`))}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable style={[styles.saveBtn, !canSave && styles.disabled]} onPress={onSave} disabled={!canSave}>
          <Text style={styles.saveText}>{updateProperty.isPending ? "Guardando..." : "Guardar piso"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: {
    paddingTop: spacing[6],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { color: colors.primary, fontWeight: "700" },
  title: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
  content: { padding: spacing[4], paddingBottom: 150, gap: spacing[3] },
  block: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[2],
  },
  blockTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text, marginBottom: 4 },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.background,
    color: colors.text,
  },
  row: { flexDirection: "row", gap: spacing[2] },
  flex: { flex: 1 },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  rulesWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginTop: spacing[1] },
  ruleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.background,
  },
  ruleChipActive: {
    borderColor: colors.text,
    backgroundColor: colors.text,
  },
  ruleChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600" },
  ruleChipTextActive: { color: colors.white },
  customRuleRow: { flexDirection: "row", gap: spacing[2], marginTop: spacing[1], alignItems: "center" },
  customRuleAddBtn: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  customRuleAddBtnText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
  customRuleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.gray100,
  },
  customRuleChipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: spacing[1] },
  switchLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: "600" },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.background,
  },
  billLabel: { color: colors.text, fontWeight: "600" },
  billModePill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
  },
  billMode: { fontWeight: "700", fontSize: fontSize.xs },
  hint: { color: colors.textSecondary, fontSize: fontSize.xs },
  footer: {
    position: "absolute",
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    gap: spacing[2],
    borderRadius: radius.xl,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
  },
  cancelText: { color: colors.textSecondary, fontWeight: "700" },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
  },
  saveText: { color: colors.white, fontWeight: "800" },
  disabled: { opacity: 0.5 },
});
