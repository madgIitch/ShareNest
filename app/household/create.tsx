import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCreateHousehold } from "../../src/hooks/useHousehold";
import { colors, fontSize, radius, spacing } from "../../src/theme";

export default function CreateHouseholdScreen() {
  const [name, setName] = useState("");
  const create = useCreateHousehold();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Nombre requerido", "Ponle un nombre a tu hogar.");
      return;
    }
    try {
      await create.mutateAsync({ name: name.trim() });
      router.replace("/(tabs)/household");
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Crear hogar</Text>
      <Text style={styles.subtitle}>
        Crea tu hogar y comparte el código de invitación con tus compañeros de piso.
      </Text>

      <View style={styles.iconRow}>
        <Text style={styles.icon}>🏡</Text>
      </View>

      <Text style={styles.label}>Nombre del hogar *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Piso de Gracia, Casa de los 4…"
        value={name}
        onChangeText={setName}
        autoFocus
        accessibilityLabel="Nombre del hogar"
      />

      <Pressable
        style={[styles.btn, create.isPending && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={create.isPending}
        accessibilityLabel="Crear hogar"
      >
        <Text style={styles.btnText}>{create.isPending ? "Creando…" : "Crear hogar"}</Text>
      </Pressable>

      <Pressable style={styles.linkBtn} onPress={() => router.replace("/household/join")}>
        <Text style={styles.linkBtnText}>¿Tienes un código? Únete aquí</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing[6], backgroundColor: colors.surface, gap: spacing[4] },
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  iconRow: { alignItems: "center", paddingVertical: spacing[4] },
  icon: { fontSize: 72 },
  label: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.md,
    color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[2],
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  linkBtn: { alignItems: "center", paddingVertical: spacing[2] },
  linkBtnText: { color: colors.textSecondary, fontSize: fontSize.sm, textDecorationLine: "underline" },
});
