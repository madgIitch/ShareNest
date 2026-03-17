// src/components/expenses/AddExpenseSheet.tsx
import { useState } from "react";
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
import { supabase } from "../../lib/supabase";
import type { ExpenseCategory, SplitType } from "../../hooks/useExpenses";
import { useAddExpense } from "../../hooks/useExpenses";
import type { HouseholdMember } from "../../hooks/useHousehold";
import { colors, fontSize, radius, spacing } from "../../theme";

const CATEGORIES: { key: ExpenseCategory; icon: string; label: string }[] = [
  { key: "luz", icon: "💡", label: "Luz" },
  { key: "agua", icon: "💧", label: "Agua" },
  { key: "gas", icon: "🔥", label: "Gas" },
  { key: "internet", icon: "📶", label: "Internet" },
  { key: "comida", icon: "🛒", label: "Comida" },
  { key: "limpieza", icon: "🧹", label: "Limpieza" },
  { key: "otros", icon: "🧾", label: "Otros" },
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

  // Step 1 state
  const [step, setStep] = useState<1 | 2>(1);
  const [amountText, setAmountText] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("otros");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // Step 2 state
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const amount = parseFloat(amountText.replace(",", ".")) || 0;
  const memberIds = members.map((m) => m.user_id);

  const resetAndClose = () => {
    setStep(1);
    setAmountText("");
    setDescription("");
    setCategory("otros");
    setDate(new Date().toISOString().slice(0, 10));
    setReceiptUri(null);
    setReceiptUrl(null);
    setUploadingReceipt(false);
    setSplitType("equal");
    setCustomSplits({});
    onClose();
  };

  const handlePickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setReceiptUri(asset.uri);

    try {
      setUploadingReceipt(true);
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const path = `receipts/${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const { error } = await supabase.storage
        .from("receipts")
        .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: false });
      if (error) throw error;

      const { data: signedData } = await supabase.storage
        .from("receipts")
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

      setReceiptUrl(signedData?.signedUrl ?? null);
    } catch (err) {
      Alert.alert("Error al subir recibo", (err as Error).message);
      setReceiptUri(null);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    if (amount <= 0) {
      Alert.alert("Importe inválido", "Introduce un importe mayor que 0.");
      return;
    }

    const parsedCustom: Record<string, number> = {};
    if (splitType === "custom") {
      for (const uid of memberIds) {
        parsedCustom[uid] = parseFloat((customSplits[uid] ?? "0").replace(",", ".")) || 0;
      }
      const total = Object.values(parsedCustom).reduce((s, v) => s + v, 0);
      if (Math.abs(total - amount) > 0.02) {
        Alert.alert("Error en el reparto", `La suma (${total.toFixed(2)} €) debe ser igual al gasto (${amount.toFixed(2)} €).`);
        return;
      }
    }

    try {
      await addExpense.mutateAsync({
        householdId,
        paidBy: currentUserId,
        amount,
        category,
        description: description.trim() || undefined,
        receiptUrl: receiptUrl ?? undefined,
        date,
        splitType,
        memberIds,
        customSplits: parsedCustom,
      });
      resetAndClose();
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
      <View style={styles.header}>
        <Pressable onPress={resetAndClose} accessibilityLabel="Cerrar">
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {step === 1 ? "Nuevo gasto" : "Reparto"}
        </Text>
        {step === 1 ? (
          <Pressable onPress={() => amount > 0 && setStep(2)} accessibilityLabel="Siguiente">
            <Text style={[styles.nextText, amount <= 0 && styles.nextTextDisabled]}>Siguiente</Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleSubmit} disabled={addExpense.isPending} accessibilityLabel="Guardar gasto">
            <Text style={styles.nextText}>{addExpense.isPending ? "..." : "Guardar"}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <>
            {/* Big amount input */}
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="decimal-pad"
                placeholder="0,00"
                value={amountText}
                onChangeText={setAmountText}
                autoFocus
                accessibilityLabel="Importe"
              />
            </View>

            {/* Description */}
            <TextInput
              style={styles.input}
              placeholder="Descripción (opcional)"
              value={description}
              onChangeText={setDescription}
              accessibilityLabel="Descripción"
            />

            {/* Date */}
            <TextInput
              style={styles.input}
              placeholder="Fecha (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
              accessibilityLabel="Fecha"
            />

            {/* Category grid */}
            <Text style={styles.sectionLabel}>Categoría</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c.key}
                  style={[styles.categoryBtn, category === c.key && styles.categoryBtnActive]}
                  onPress={() => setCategory(c.key)}
                  accessibilityLabel={c.label}
                >
                  <Text style={styles.categoryIcon}>{c.icon}</Text>
                  <Text style={[styles.categoryLabel, category === c.key && styles.categoryLabelActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Receipt */}
            <Text style={styles.sectionLabel}>Recibo (opcional)</Text>
            {receiptUri ? (
              <View style={styles.receiptPreview}>
                <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                {uploadingReceipt && (
                  <View style={styles.receiptOverlay}>
                    <ActivityIndicator color={colors.white} />
                  </View>
                )}
                <Pressable style={styles.receiptRemove} onPress={() => { setReceiptUri(null); setReceiptUrl(null); }}>
                  <Text style={styles.receiptRemoveText}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.receiptPicker} onPress={handlePickReceipt} accessibilityLabel="Añadir foto de recibo">
                <Text style={styles.receiptPickerText}>📷 Añadir foto del recibo</Text>
              </Pressable>
            )}
          </>
        ) : (
          <>
            {/* Split type toggle */}
            <Text style={styles.sectionLabel}>Tipo de reparto</Text>
            <View style={styles.splitToggle}>
              <Pressable
                style={[styles.splitTypeBtn, splitType === "equal" && styles.splitTypeBtnActive]}
                onPress={() => setSplitType("equal")}
              >
                <Text style={[styles.splitTypeBtnText, splitType === "equal" && styles.splitTypeBtnTextActive]}>
                  A partes iguales
                </Text>
              </Pressable>
              <Pressable
                style={[styles.splitTypeBtn, splitType === "custom" && styles.splitTypeBtnActive]}
                onPress={() => setSplitType("custom")}
              >
                <Text style={[styles.splitTypeBtnText, splitType === "custom" && styles.splitTypeBtnTextActive]}>
                  Personalizado
                </Text>
              </Pressable>
            </View>

            {/* Members list */}
            <Text style={styles.sectionLabel}>Participantes</Text>
            {members.map((m) => {
              const name = m.profiles?.full_name ?? m.user_id.slice(0, 8);
              const equalShare = amount > 0 ? (amount / memberIds.length).toFixed(2) : "0.00";

              return (
                <View key={m.user_id} style={styles.memberRow}>
                  <Text style={styles.memberName}>{name}</Text>
                  {splitType === "equal" ? (
                    <Text style={styles.memberShare}>€{equalShare}</Text>
                  ) : (
                    <View style={styles.customInputWrapper}>
                      <Text style={styles.currencySmall}>€</Text>
                      <TextInput
                        style={styles.customInput}
                        keyboardType="decimal-pad"
                        placeholder="0,00"
                        value={customSplits[m.user_id] ?? ""}
                        onChangeText={(v) => setCustomSplits((prev) => ({ ...prev, [m.user_id]: v }))}
                      />
                    </View>
                  )}
                </View>
              );
            })}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total gasto</Text>
              <Text style={styles.totalAmount}>€{amount.toFixed(2)}</Text>
            </View>
          </>
        )}
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
  cancelText: { fontSize: fontSize.md, color: colors.textSecondary },
  nextText: { fontSize: fontSize.md, fontWeight: "700", color: colors.primary },
  nextTextDisabled: { color: colors.gray300 },

  sheet: { flex: 1, backgroundColor: colors.surface },
  sheetContent: { padding: spacing[5], gap: spacing[4], paddingBottom: spacing[10] },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  currencySymbol: { fontSize: 40, fontWeight: "700", color: colors.text, marginRight: 8 },
  amountInput: {
    fontSize: 56,
    fontWeight: "800",
    color: colors.text,
    minWidth: 120,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  categoryBtn: {
    width: 80,
    padding: spacing[2],
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  categoryBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  categoryIcon: { fontSize: 22 },
  categoryLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: "600" },
  categoryLabelActive: { color: colors.primary },

  receiptPicker: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    padding: spacing[4],
    alignItems: "center",
  },
  receiptPickerText: { color: colors.textSecondary, fontSize: fontSize.sm },
  receiptPreview: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  receiptImage: { width: 120, height: 120 },
  receiptOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  receiptRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptRemoveText: { color: colors.white, fontSize: 11, fontWeight: "700" },

  splitToggle: {
    flexDirection: "row",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing[2],
  },
  splitTypeBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  splitTypeBtnActive: { backgroundColor: colors.primaryLight },
  splitTypeBtnText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textSecondary },
  splitTypeBtnTextActive: { color: colors.primary },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberName: { fontSize: fontSize.md, color: colors.text, flex: 1 },
  memberShare: { fontSize: fontSize.md, fontWeight: "700", color: colors.primary },
  customInputWrapper: { flexDirection: "row", alignItems: "center" },
  currencySmall: { fontSize: fontSize.md, color: colors.textSecondary, marginRight: 4 },
  customInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: 6,
    fontSize: fontSize.md,
    width: 80,
    textAlign: "right",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing[3],
    marginTop: spacing[2],
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  totalAmount: { fontSize: fontSize.md, fontWeight: "800", color: colors.primary },
});
