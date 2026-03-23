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
import type { Json } from "../../../src/types/database";

type BillsKey = "agua" | "luz" | "gas" | "internet" | "limpieza" | "comunidad" | "calefaccion";
type BillsMode = "included" | "separate" | "none";
type BillsForm = Record<BillsKey, BillsMode>;

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

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;

  const { data: property, isLoading } = useProperty(id);
  const updateProperty = useUpdateProperty();

  const [address, setAddress] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [floor, setFloor] = useState("");
  const [totalM2, setTotalM2] = useState("");
  const [totalRooms, setTotalRooms] = useState("");
  const [hasElevator, setHasElevator] = useState(false);
  const [houseRulesText, setHouseRulesText] = useState("");
  const [bills, setBills] = useState<BillsForm>(DEFAULT_BILLS);

  useEffect(() => {
    if (!property) return;
    setAddress(property.address ?? "");
    setStreetNumber(property.street_number ?? "");
    setPostalCode(property.postal_code ?? "");
    setFloor(property.floor ?? "");
    setTotalM2(property.total_m2 != null ? String(property.total_m2) : "");
    setTotalRooms(property.total_rooms != null ? String(property.total_rooms) : "");
    setHasElevator(!!property.has_elevator);
    setHouseRulesText((property.house_rules ?? []).join(", "));
    setBills(parseBills(property.bills_config));
  }, [property]);

  const canSave = useMemo(() => !!address.trim() && !!property && !updateProperty.isPending, [address, property, updateProperty.isPending]);

  const onSave = async () => {
    if (!property || !canSave) return;
    const rules = houseRulesText
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    await updateProperty.mutateAsync({
      id: property.id,
      ownerId: myId,
      updates: {
        address: address.trim(),
        street_number: streetNumber.trim() || null,
        postal_code: postalCode.trim() || null,
        floor: floor.trim() || null,
        total_m2: totalM2.trim() ? Number(totalM2) : null,
        total_rooms: totalRooms.trim() ? Number(totalRooms) : null,
        has_elevator: hasElevator,
        house_rules: rules.length > 0 ? rules : null,
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
          <Text style={styles.blockTitle}>Direccion del piso</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Direccion" />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex]}
              value={streetNumber}
              onChangeText={setStreetNumber}
              placeholder="Numero"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="Codigo postal"
            />
          </View>
          <TextInput style={styles.input} value={floor} onChangeText={setFloor} placeholder="Planta / puerta" />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Datos del piso</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex]}
              value={totalM2}
              onChangeText={setTotalM2}
              placeholder="m2 totales"
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.flex]}
              value={totalRooms}
              onChangeText={setTotalRooms}
              placeholder="Habitaciones"
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
              <Text style={styles.billMode}>{modeLabel(bills[key])}</Text>
            </Pressable>
          ))}
          <Text style={styles.hint}>Pulsa cada gasto para alternar: incluido, a parte o no hay.</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Normas de casa</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={houseRulesText}
            onChangeText={setHouseRulesText}
            multiline
            placeholder="Ejemplo: Sin mascotas, No fumar, No fiestas"
          />
          <Text style={styles.hint}>Separalas con comas.</Text>
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
  content: { padding: spacing[4], paddingBottom: 120, gap: spacing[3] },
  block: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[2],
  },
  blockTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text, marginBottom: 4 },
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
  billMode: { color: colors.primary, fontWeight: "700" },
  hint: { color: colors.textSecondary, fontSize: fontSize.xs },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    gap: spacing[2],
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
