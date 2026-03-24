import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useJoinHousehold, useMyHousehold } from "../../src/hooks/useHousehold";
import { colors, fontSize, radius, spacing } from "../../src/theme";

export default function JoinHouseholdScreen() {
  const [code, setCode] = useState("");
  const join = useJoinHousehold();
  const { data: existing } = useMyHousehold();

  const handleJoin = async () => {
    if (code.trim().length !== 6) {
      Alert.alert("Codigo invalido", "El codigo de invitacion debe tener 6 caracteres.");
      return;
    }

    const proceed = async () => {
      try {
        await join.mutateAsync(code.trim().toUpperCase());
        router.replace("/(tabs)/workspace");
      } catch (err) {
        Alert.alert("Error", (err as Error).message);
      }
    };

    if (existing) {
      Alert.alert(
        "Ya perteneces a un household",
        "Si continuas, te uniras tambien al nuevo household con este codigo.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Continuar", onPress: proceed },
        ],
      );
      return;
    }

    await proceed();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Unirse a un piso</Text>
      <Text style={styles.subtitle}>
        Introduce el codigo de 6 caracteres que te compartio el propietario para entrar al household.
      </Text>

      <View style={styles.codeRow}>
        <TextInput
          style={styles.codeInput}
          placeholder="A"
          maxLength={6}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoFocus
          textAlign="center"
        />
      </View>

      <Pressable
        style={[styles.btn, (join.isPending || code.trim().length !== 6) && styles.btnDisabled]}
        onPress={handleJoin}
        disabled={join.isPending || code.trim().length !== 6}
      >
        <Text style={styles.btnText}>{join.isPending ? "Uniendote..." : "Unirme al piso"}</Text>
      </Pressable>

      <Pressable style={styles.linkBtn} onPress={() => router.replace("/household/create")}>
        <Text style={styles.linkBtnText}>No hay household creado. Crear uno rapido</Text>
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
  codeRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing[3],
  },
  codeInput: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 12,
    color: colors.text,
  },
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

