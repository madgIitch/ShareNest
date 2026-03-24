import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { useAddExpense, type ExpenseCategory, type SplitType } from "../../hooks/useExpenses";
import type { HouseholdMember } from "../../hooks/useHousehold";
import { supabase } from "../../lib/supabase";
import { colors, fontSize, radius, spacing } from "../../theme";

type CategoryOption = ExpenseCategory | "libre";
type SplitMode = "equal" | "custom" | "select";

const CATEGORIES: Array<{ key: CategoryOption; icon: string; label: string }> = [
  { key: "luz", icon: "\u26A1", label: "Luz" },
  { key: "agua", icon: "\u{1F4A7}", label: "Agua" },
  { key: "gas", icon: "\u{1F525}", label: "Gas" },
  { key: "internet", icon: "\u{1F310}", label: "Internet" },
  { key: "comida", icon: "\u{1F6D2}", label: "Comida" },
  { key: "limpieza", icon: "\u{1F9F9}", label: "Limpieza" },
  { key: "otros", icon: "\u{1F4E6}", label: "Otros" },
  { key: "libre", icon: "\u270F", label: "Libre" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  householdId: string;
  currentUserId: string;
  members: HouseholdMember[];
}

export function AddExpenseSheet({ visible, onClose, householdId, currentUserId, members }: Props) {
  const addExpense = useAddExpense();

  const [amountText, setAmountText] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<CategoryOption>("otros");
  const [customCategory, setCustomCategory] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);

  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(members.map((m) => [m.user_id, true])),
  );
  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((m) => [m.user_id, ""])),
  );

  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);

  const amount = parseFloat(amountText.replace(",", ".")) || 0;
  const selectedMemberIds = useMemo(
    () => members.filter((m) => selectedParticipants[m.user_id]).map((m) => m.user_id),
    [members, selectedParticipants],
  );

  const totalPercent = useMemo(
    () =>
      selectedMemberIds.reduce(
        (sum, id) => sum + (parseFloat((customPercentages[id] ?? "0").replace(",", ".")) || 0),
        0,
      ),
    [customPercentages, selectedMemberIds],
  );

  const resetAndClose = () => {
    setAmountText("");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
    setCategory("otros");
    setCustomCategory("");
    setPaidBy(currentUserId);
    setSplitMode("equal");
    setSelectedParticipants(Object.fromEntries(members.map((m) => [m.user_id, true])));
    setCustomPercentages(Object.fromEntries(members.map((m) => [m.user_id, ""])));
    setReceiptUri(null);
    setReceiptUploading(false);
    onClose();
  };

  const uploadReceiptForExpense = async (expenseId: string, localUri: string) => {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const storagePath = `${householdId}/${expenseId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(storagePath, arrayBuffer, { contentType: "image/jpeg", upsert: true });
    if (uploadError) throw uploadError;
    return storagePath;
  };

  const pickReceipt = async (mode: "camera" | "library") => {
    if (mode === "camera") {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (!cam.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso a la camara para capturar el recibo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) setReceiptUri(result.assets[0]?.uri ?? null);
      return;
    }

    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!lib.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a la galeria para adjuntar el recibo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setReceiptUri(result.assets[0]?.uri ?? null);
  };

  const openReceiptPicker = () => {
    Alert.alert("Adjuntar recibo", "Elige origen", [
      { text: "Camara", onPress: () => pickReceipt("camera") },
      { text: "Galeria", onPress: () => pickReceipt("library") },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const onToggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleSubmit = async () => {
    if (amount <= 0) {
      Alert.alert("Importe invalido", "Introduce un importe mayor que 0.");
      return;
    }
    if (selectedMemberIds.length === 0) {
      Alert.alert("Participantes", "Selecciona al menos un miembro.");
      return;
    }
    if (category === "libre" && !customCategory.trim()) {
      Alert.alert("Categoria", "Escribe una categoria para la opcion Libre.");
      return;
    }

    let splits: Array<{ user_id: string; amount: number }> = [];
    if (splitMode === "custom") {
      if (Math.abs(totalPercent - 100) > 0.01) {
        Alert.alert("Porcentajes invalidos", `El total debe sumar 100%. Ahora mismo: ${totalPercent.toFixed(2)}%.`);
        return;
      }
      splits = selectedMemberIds.map((userId) => {
        const p = parseFloat((customPercentages[userId] ?? "0").replace(",", ".")) || 0;
        return { user_id: userId, amount: (amount * p) / 100 };
      });
    } else {
      const each = amount / selectedMemberIds.length;
      splits = selectedMemberIds.map((userId) => ({ user_id: userId, amount: each }));
    }

    const activeCategory: ExpenseCategory = category === "libre" ? "otros" : category;
    const extraTag = category === "libre" ? `[${customCategory.trim()}]` : "";
    const finalDescription = [extraTag, description.trim()].filter(Boolean).join(" ").trim();
    const splitType: SplitType =
      splitMode === "custom" || selectedMemberIds.length !== members.length ? "custom" : "equal";

    try {
      let expenseId: string | undefined;
      let receiptPath: string | undefined;
      if (receiptUri) {
        if (typeof globalThis.crypto?.randomUUID !== "function") {
          Alert.alert("Error", "No se pudo generar el ID del gasto para adjuntar el recibo.");
          return;
        }
        expenseId = globalThis.crypto.randomUUID();
        setReceiptUploading(true);
        receiptPath = await uploadReceiptForExpense(expenseId, receiptUri);
      }

      await addExpense.mutateAsync({
        expenseId,
        householdId,
        paidBy,
        amount,
        category: activeCategory,
        description: finalDescription || undefined,
        receiptUrl: receiptPath,
        date,
        splitType,
        splits,
      });
      resetAndClose();
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setReceiptUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
      <View style={styles.header}>
        <Pressable onPress={resetAndClose} accessibilityLabel="Cerrar">
          <Text style={styles.cancelText}>Cerrar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Anadir gasto</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={addExpense.isPending || receiptUploading}
          accessibilityLabel="Guardar gasto"
        >
          <Text style={styles.saveText}>
            {addExpense.isPending || receiptUploading ? "Guardando..." : "Guardar"}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.centerLabel}>Pagado</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>EUR</Text>
          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            placeholder="0"
            value={amountText}
            onChangeText={setAmountText}
            autoFocus
          />
        </View>

        <Text style={styles.sectionLabel}>Categoria</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              style={[styles.categoryBtn, category === c.key && styles.categoryBtnActive]}
              onPress={() => setCategory(c.key)}
            >
              <Text style={styles.categoryIcon}>{c.icon}</Text>
              <Text style={[styles.categoryLabel, category === c.key && styles.categoryLabelActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
        {category === "libre" && (
          <TextInput
            style={styles.input}
            placeholder="Ej: Ocio, Comunidad, Parking..."
            value={customCategory}
            onChangeText={setCustomCategory}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Descripcion (opcional)"
          value={description}
          onChangeText={setDescription}
        />

        <TextInput
          style={styles.input}
          placeholder="Fecha (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.sectionLabel}>Quien pago</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {members.map((m) => {
            const active = paidBy === m.user_id;
            const label = m.user_id === currentUserId ? "Yo" : (m.profiles?.full_name ?? "Miembro");
            return (
              <Pressable
                key={m.user_id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setPaidBy(m.user_id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>Como dividir</Text>
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, splitMode === "equal" && styles.tabActive]}
            onPress={() => {
              setSplitMode("equal");
              setSelectedParticipants(Object.fromEntries(members.map((m) => [m.user_id, true])));
            }}
          >
            <Text style={[styles.tabText, splitMode === "equal" && styles.tabTextActive]}>Igual</Text>
          </Pressable>
          <Pressable style={[styles.tab, splitMode === "custom" && styles.tabActive]} onPress={() => setSplitMode("custom")}>
            <Text style={[styles.tabText, splitMode === "custom" && styles.tabTextActive]}>Personalizado</Text>
          </Pressable>
          <Pressable style={[styles.tab, splitMode === "select" && styles.tabActive]} onPress={() => setSplitMode("select")}>
            <Text style={[styles.tabText, splitMode === "select" && styles.tabTextActive]}>Seleccionar</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Participantes</Text>
        {members.map((m) => {
          const selected = !!selectedParticipants[m.user_id];
          const name = m.user_id === currentUserId ? "Tu" : (m.profiles?.full_name ?? "Miembro");
          const percentage = parseFloat((customPercentages[m.user_id] ?? "0").replace(",", ".")) || 0;
          const amountForRow =
            splitMode === "custom"
              ? (amount * percentage) / 100
              : selectedMemberIds.length > 0 && selected
                ? amount / selectedMemberIds.length
                : 0;

          return (
            <View key={m.user_id} style={styles.memberRow}>
              <Pressable
                style={styles.memberMain}
                onPress={() => splitMode !== "equal" && onToggleParticipant(m.user_id)}
              >
                <View style={[styles.selectorDot, selected && styles.selectorDotActive]} />
                <Text style={styles.memberName}>{name}</Text>
              </Pressable>

              {splitMode === "custom" ? (
                <View style={styles.customPercentWrap}>
                  <TextInput
                    style={[styles.percentInput, !selected && styles.percentInputDisabled]}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    value={customPercentages[m.user_id] ?? ""}
                    editable={selected}
                    onChangeText={(v) => setCustomPercentages((prev) => ({ ...prev, [m.user_id]: v }))}
                  />
                  <Text style={styles.percentSign}>%</Text>
                  <Text style={styles.memberAmount}>EUR {amountForRow.toFixed(2)}</Text>
                </View>
              ) : (
                <Text style={[styles.memberAmount, !selected && styles.memberAmountMuted]}>
                  {selected ? `EUR ${amountForRow.toFixed(2)}` : "-"}
                </Text>
              )}
            </View>
          );
        })}

        {splitMode === "custom" && (
          <Text style={[styles.helper, Math.abs(totalPercent - 100) <= 0.01 ? styles.helperOk : styles.helperWarn]}>
            Total asignado: {totalPercent.toFixed(2)}%
          </Text>
        )}

        <Text style={styles.sectionLabel}>Justificante</Text>
        {receiptUri ? (
          <View style={styles.receiptPreview}>
            <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
            {(receiptUploading || addExpense.isPending) && (
              <View style={styles.receiptOverlay}>
                <ActivityIndicator color={colors.white} />
              </View>
            )}
            <Pressable style={styles.receiptRemove} onPress={() => setReceiptUri(null)}>
              <Text style={styles.receiptRemoveText}>x</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.receiptPicker} onPress={openReceiptPicker}>
            <Text style={styles.receiptPickerText}>Adjuntar foto del recibo</Text>
          </Pressable>
        )}

        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            Total {amount > 0 ? `EUR ${amount.toFixed(2)}` : "EUR 0.00"} - {selectedMemberIds.length} personas
          </Text>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  cancelText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: "600" },
  saveText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "700" },

  sheet: { flex: 1, backgroundColor: colors.surface },
  sheetContent: { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[10] },
  centerLabel: { textAlign: "center", color: colors.textSecondary, fontSize: fontSize.sm },
  amountRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  currencySymbol: { fontSize: 26, color: colors.textSecondary, marginRight: spacing[2], fontWeight: "700" },
  amountInput: { fontSize: 52, color: colors.text, fontWeight: "800", minWidth: 130, textAlign: "left" },

  sectionLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.textTertiary, textTransform: "uppercase" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  categoryBtn: {
    width: "23%",
    minWidth: 78,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    alignItems: "center",
    gap: 2,
  },
  categoryBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  categoryIcon: { fontSize: 17 },
  categoryLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: "600" },
  categoryLabelActive: { color: colors.primary },

  chipsRow: { gap: spacing[2] },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: "600" },
  chipTextActive: { color: colors.primary },

  tabs: { flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  tab: { flex: 1, paddingVertical: spacing[2], alignItems: "center", backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primaryLight },
  tabText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: "600" },
  tabTextActive: { color: colors.primary },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing[2],
  },
  memberMain: { flexDirection: "row", alignItems: "center", gap: spacing[2], flex: 1 },
  selectorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectorDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  memberName: { color: colors.text, fontSize: fontSize.md, fontWeight: "600" },
  customPercentWrap: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  percentInput: {
    width: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 4,
    textAlign: "right",
    paddingHorizontal: 6,
    color: colors.text,
  },
  percentInputDisabled: { opacity: 0.5 },
  percentSign: { color: colors.textSecondary, fontWeight: "700" },
  memberAmount: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700", minWidth: 84, textAlign: "right" },
  memberAmountMuted: { color: colors.textTertiary },
  helper: { fontSize: fontSize.xs, fontWeight: "700" },
  helperOk: { color: colors.success },
  helperWarn: { color: colors.error },

  receiptPicker: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  receiptPickerText: { color: colors.textSecondary, fontWeight: "600" },
  receiptPreview: { width: "100%", height: 180, borderRadius: radius.md, overflow: "hidden", position: "relative" },
  receiptImage: { width: "100%", height: "100%" },
  receiptOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptRemove: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptRemoveText: { color: colors.white, fontWeight: "800" },

  summaryBar: {
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    alignItems: "center",
    backgroundColor: colors.background,
  },
  summaryText: { color: colors.text, fontWeight: "700", fontSize: fontSize.sm },
});
