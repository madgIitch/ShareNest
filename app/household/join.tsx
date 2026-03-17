import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { useMyHousehold, useJoinHousehold } from "../../src/hooks/useHousehold";
import { colors, fontSize, radius, spacing } from "../../src/theme";

export default function JoinHouseholdScreen() {
  const [code, setCode] = useState("");
  const join = useJoinHousehold();
  const { data: existing } = useMyHousehold();

  const handleJoin = async () => {
    if (code.trim().length !== 6) {
      Alert.alert("Código inválido", "El código de invitación tiene 6 caracteres.");
      return;
    }

    const proceed = async () => {
      try {
        await join.mutateAsync(code.trim());
        router.replace("/(tabs)/household");
      } catch (err) {
        Alert.alert("Error", (err as Error).message);
      }
    };

    if (existing) {
      Alert.alert(
        "Ya tienes un hogar",
        "Si te unes a otro hogar seguirás siendo miembro del actual. ¿Continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Continuar", onPress: proceed },
        ],
      );
    } else {
      await proceed();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Unirse a un hogar</Text>
      <Text style={styles.subtitle}>
        Introduce el código de invitación de 6 caracteres que te ha compartido un compañero.
      </Text>

      <Text style={styles.icon}>🔑</Text>

      <TextInput
        style={styles.codeInput}
        placeholder="ABC123"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        maxLength={6}
        autoCapitalize="characters"
        autoFocus
        textAlign="center"
        accessibilityLabel="Código de invitación"
      />

      <Pressable
        style={[styles.btn, (join.isPending || code.trim().length !== 6) && styles.btnDisabled]}
        onPress={handleJoin}
        disabled={join.isPending || code.trim().length !== 6}
        accessibilityLabel="Unirse al hogar"
      >
        <Text style={styles.btnText}>{join.isPending ? "Uniéndose…" : "Unirse al hogar"}</Text>
      </Pressable>

      <Pressable style={styles.linkBtn} onPress={() => router.replace("/household/create")}>
        <Text style={styles.linkBtnText}>Crear un nuevo hogar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing[6], backgroundColor: colors.surface, gap: spacing[4], alignItems: "center" },
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text, alignSelf: "flex-start" },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22, alignSelf: "flex-start" },
  icon: { fontSize: 64, marginVertical: spacing[4] },
  codeInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 8,
    color: colors.text,
    textAlign: "center",
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    alignItems: "center",
    width: "100%",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  linkBtn: { paddingVertical: spacing[2] },
  linkBtnText: { color: colors.textSecondary, fontSize: fontSize.sm, textDecorationLine: "underline" },
});
