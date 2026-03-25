// src/components/expenses/BalanceCard.tsx
import { StyleSheet, Text, View } from "react-native";
import type { BalancesResult } from "../../hooks/useExpenses";
import { colors, fontSize, radius, spacing } from "../../theme";

interface Props {
  data: BalancesResult;
  currentUserId: string;
}

export function BalanceCard({ data, currentUserId }: Props) {
  const { transfers, profiles } = data;

  const getName = (id: string) => {
    const p = profiles.find((p) => p.id === id);
    return p?.full_name ?? id.slice(0, 8) + "…";
  };

  const myBalance = data.balances.find((b) => b.user_id === currentUserId);
  const net = myBalance ? Number(myBalance.net_balance) : 0;

  // Transfers that involve me
  const iOwe = transfers.filter((t) => t.from === currentUserId);
  const owedToMe = transfers.filter((t) => t.to === currentUserId);

  if (transfers.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.allClear}>✅ Todo saldado</Text>
        <Text style={styles.allClearSub}>No hay deudas pendientes en el hogar.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Net balance chip */}
      <View style={[styles.netChip, net >= 0 ? styles.netChipPositive : styles.netChipNegative]}>
        <Text style={[styles.netText, net >= 0 ? styles.netTextPositive : styles.netTextNegative]}>
          {net >= 0 ? `Te deben €${net.toFixed(2)}` : `Debes €${Math.abs(net).toFixed(2)}`}
        </Text>
      </View>

      {/* Transfers I owe */}
      {iOwe.map((t, i) => (
        <View key={i} style={styles.transferRow}>
          <Text style={styles.transferIcon}>💸</Text>
          <Text style={styles.transferText}>
            Debes <Text style={styles.bold}>€{t.amount.toFixed(2)}</Text> a {getName(t.to)}
          </Text>
        </View>
      ))}

      {/* Transfers owed to me */}
      {owedToMe.map((t, i) => (
        <View key={i} style={styles.transferRow}>
          <Text style={styles.transferIcon}>💰</Text>
          <Text style={styles.transferText}>
            {getName(t.from)} te debe <Text style={styles.bold}>€{t.amount.toFixed(2)}</Text>
          </Text>
        </View>
      ))}

      {/* All household transfers (if others involved) */}
      {transfers.filter((t) => t.from !== currentUserId && t.to !== currentUserId).length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.otherLabel}>Otros en el hogar</Text>
          {transfers
            .filter((t) => t.from !== currentUserId && t.to !== currentUserId)
            .map((t, i) => (
              <View key={i} style={styles.transferRow}>
                <Text style={styles.transferIcon}>↔️</Text>
                <Text style={[styles.transferText, { color: colors.textSecondary }]}>
                  {getName(t.from)} → {getName(t.to)}: €{t.amount.toFixed(2)}
                </Text>
              </View>
            ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  allClear: { fontSize: fontSize.lg, fontWeight: "700", color: colors.success, textAlign: "center" },
  allClearSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center" },
  netChip: {
    borderRadius: radius.full,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    alignSelf: "flex-start",
  },
  netChipPositive: { backgroundColor: colors.successLight },
  netChipNegative: { backgroundColor: colors.errorLight },
  netText: { fontSize: fontSize.md, fontWeight: "800" },
  netTextPositive: { color: colors.success },
  netTextNegative: { color: colors.error },
  transferRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  transferIcon: { fontSize: 18 },
  transferText: { fontSize: fontSize.sm, color: colors.text, flex: 1 },
  bold: { fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.border },
  otherLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.textTertiary },
});
