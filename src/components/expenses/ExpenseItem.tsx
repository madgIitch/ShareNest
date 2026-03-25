// src/components/expenses/ExpenseItem.tsx
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Expense, ExpenseSplit } from "../../hooks/useExpenses";
import { useExpenseSplits, useSettleSplit } from "../../hooks/useExpenses";
import { supabase } from "../../lib/supabase";
import { colors, fontSize, radius, spacing } from "../../theme";

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  luz:      { icon: "💡", color: "#fef9c3" },
  agua:     { icon: "💧", color: "#dbeafe" },
  gas:      { icon: "🔥", color: "#ffedd5" },
  internet: { icon: "📶", color: "#e0e7ff" },
  comida:   { icon: "🛒", color: "#dcfce7" },
  limpieza: { icon: "🧹", color: "#f3e8ff" },
  otros:    { icon: "🧾", color: "#f3f4f6" },
};

interface Props {
  expense: Expense;
  currentUserId: string;
  householdId: string;
}

export function ExpenseItem({ expense, currentUserId, householdId }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.otros;

  return (
    <>
      <Pressable style={styles.row} onPress={() => setDetailOpen(true)} accessibilityLabel={`Gasto: ${expense.description ?? expense.category}`}>
        <View style={[styles.iconCircle, { backgroundColor: meta.color }]}>
          <Text style={styles.icon}>{meta.icon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.desc} numberOfLines={1}>
            {expense.description ?? meta.icon + " " + expense.category}
          </Text>
          <Text style={styles.meta}>
            {expense.profiles?.full_name ?? "—"} · {expense.date}
          </Text>
        </View>
        <Text style={styles.amount}>€{Number(expense.amount).toFixed(2)}</Text>
      </Pressable>

      <ExpenseDetailModal
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        expense={expense}
        currentUserId={currentUserId}
        householdId={householdId}
      />
    </>
  );
}

function ExpenseDetailModal({
  visible, onClose, expense, currentUserId, householdId,
}: {
  visible: boolean;
  onClose: () => void;
  expense: Expense;
  currentUserId: string;
  householdId: string;
}) {
  const { data: splits = [] } = useExpenseSplits(expense.id);
  const settle = useSettleSplit();
  const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.otros;
  const mysplits = splits.filter((s) => s.user_id === currentUserId && !s.is_settled);
  const [receiptSignedUrl, setReceiptSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadReceipt = async () => {
      if (!visible || !expense.receipt_url) {
        setReceiptSignedUrl(null);
        return;
      }
      if (expense.receipt_url.startsWith("http://") || expense.receipt_url.startsWith("https://")) {
        setReceiptSignedUrl(expense.receipt_url);
        return;
      }
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(expense.receipt_url, 60 * 60);
      if (!cancelled) {
        if (error) setReceiptSignedUrl(null);
        else setReceiptSignedUrl(data?.signedUrl ?? null);
      }
    };

    void loadReceipt();
    return () => {
      cancelled = true;
    };
  }, [expense.receipt_url, visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
        <Pressable style={styles.closeBtn} onPress={onClose} accessibilityLabel="Cerrar">
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>

        {/* Header */}
        <View style={[styles.detailIconCircle, { backgroundColor: meta.color }]}>
          <Text style={styles.detailIcon}>{meta.icon}</Text>
        </View>
        <Text style={styles.detailAmount}>€{Number(expense.amount).toFixed(2)}</Text>
        <Text style={styles.detailDesc}>{expense.description ?? expense.category}</Text>
        <Text style={styles.detailMeta}>
          Pagado por {expense.profiles?.full_name ?? "—"} · {expense.date}
        </Text>

        {/* Receipt */}
        {receiptSignedUrl && (
          <Image source={{ uri: receiptSignedUrl }} style={styles.receipt} resizeMode="contain" />
        )}

        {/* Splits */}
        <Text style={styles.sectionLabel}>Reparto</Text>
        {splits.map((s) => (
          <View key={s.id} style={styles.splitRow}>
            <Text style={styles.splitUser}>{formatSplitUserLabel(s, currentUserId)}</Text>
            <Text style={styles.splitAmount}>€{Number(s.amount).toFixed(2)}</Text>
            <View style={[styles.settledChip, s.is_settled ? styles.settledChipGreen : styles.settledChipRed]}>
              <Text style={styles.settledChipText}>{s.is_settled ? "Saldado" : "Pendiente"}</Text>
            </View>
          </View>
        ))}

        {/* Settle my pending splits */}
        {mysplits.map((s) => (
          <Pressable
            key={s.id}
            style={styles.settleBtn}
            onPress={() => settle.mutate({ splitId: s.id, householdId })}
            disabled={settle.isPending}
            accessibilityLabel="Marcar como saldado"
          >
            <Text style={styles.settleBtnText}>
              {settle.isPending ? "Guardando…" : "✓ Marcar mi parte como saldada"}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Modal>
  );
}

function formatSplitUserLabel(split: ExpenseSplit, currentUserId: string) {
  if (split.user_id === currentUserId) return "Tu";
  return split.profiles?.full_name ?? `${split.user_id.slice(0, 8)}...`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  desc: { fontSize: fontSize.md, fontWeight: "600", color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: fontSize.md, fontWeight: "800", color: colors.text },

  modal: { flex: 1, backgroundColor: colors.surface },
  modalContent: { padding: spacing[5], alignItems: "center", paddingBottom: spacing[10] },
  closeBtn: { alignSelf: "flex-end", padding: spacing[2] },
  closeBtnText: { fontSize: 20, color: colors.textSecondary },

  detailIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  detailIcon: { fontSize: 32 },
  detailAmount: { fontSize: 48, fontWeight: "800", color: colors.text },
  detailDesc: { fontSize: fontSize.lg, color: colors.textSecondary, marginTop: spacing[1] },
  detailMeta: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 4 },

  receipt: { width: "100%", height: 220, marginTop: spacing[4], borderRadius: radius.md },

  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    alignSelf: "flex-start",
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  splitUser: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  splitAmount: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  settledChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  settledChipGreen: { backgroundColor: colors.successLight },
  settledChipRed: { backgroundColor: colors.errorLight },
  settledChipText: { fontSize: 11, fontWeight: "700" },

  settleBtn: {
    marginTop: spacing[4],
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderWidth: 1,
    borderColor: colors.primary,
  },
  settleBtnText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
});
