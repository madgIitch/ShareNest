import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useCreateHouseholdQuick } from "../../src/hooks/useHousehold";
import { colors, fontSize, radius, spacing } from "../../src/theme";

export default function CreateHouseholdScreen() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [floor, setFloor] = useState("");

  const create = useCreateHouseholdQuick();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Nombre requerido", "Ponle un nombre al household.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Direccion requerida", "Introduce al menos la direccion principal.");
      return;
    }

    try {
      const created = await create.mutateAsync({
        name: name.trim(),
        address: address.trim(),
        streetNumber: streetNumber.trim() || null,
        postalCode: postalCode.trim() || null,
        floor: floor.trim() || null,
      });
      if (created?.household_id) {
        router.replace({ pathname: "/household/invite", params: { householdId: created.household_id } });
      } else {
        router.replace("/(tabs)/household");
      }
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Crear household</Text>
      <Text style={styles.subtitle}>
        Flujo rapido para pisos sin anuncio. Crea household + piso base y comparte codigo.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre del piso</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Piso Malasana"
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Direccion</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Calle del Pez"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Numero</Text>
          <TextInput
            style={styles.input}
            placeholder="14"
            value={streetNumber}
            onChangeText={setStreetNumber}
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Codigo postal</Text>
          <TextInput
            style={styles.input}
            placeholder="28004"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Planta / puerta</Text>
        <TextInput
          style={styles.input}
          placeholder="2 izquierda"
          value={floor}
          onChangeText={setFloor}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Que se crea</Text>
        <Text style={styles.infoText}>- Household sin anuncio publico</Text>
        <Text style={styles.infoText}>- Tu como admin del household</Text>
        <Text style={styles.infoText}>- Propiedad base para gastos y convivencia</Text>
      </View>

      <Pressable
        style={[styles.btn, create.isPending && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={create.isPending}
      >
        <Text style={styles.btnText}>{create.isPending ? "Creando..." : "Crear household"}</Text>
      </Pressable>

      <Pressable style={styles.linkBtn} onPress={() => router.replace("/household/join")}>
        <Text style={styles.linkBtnText}>Tengo codigo, quiero unirme</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing[5],
    backgroundColor: colors.background,
    gap: spacing[3],
  },
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  field: { gap: spacing[1] },
  row: { flexDirection: "row", gap: spacing[2] },
  label: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: "700", textTransform: "uppercase" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.md,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing[3],
    gap: spacing[1],
  },
  infoTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  infoText: { fontSize: fontSize.sm, color: colors.textSecondary },
  btn: {
    borderRadius: radius.full,
    backgroundColor: colors.text,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: "700" },
  linkBtn: { alignItems: "center", paddingVertical: spacing[2] },
  linkBtnText: { color: colors.verify, fontSize: fontSize.sm, fontWeight: "600" },
});
