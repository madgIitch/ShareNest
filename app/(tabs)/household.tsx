import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AddExpenseSheet } from "../../src/components/expenses/AddExpenseSheet";
import { BalanceCard } from "../../src/components/expenses/BalanceCard";
import { ExpenseItem } from "../../src/components/expenses/ExpenseItem";
import { useBalances, useExpenses } from "../../src/hooks/useExpenses";
import { useHouseholdMembers, useMyHousehold } from "../../src/hooks/useHousehold";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";

export default function HouseholdScreen() {
  const { session } = useAuth();
  const myId = session?.user?.id ?? "";

  const { data: household, isLoading } = useMyHousehold();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!household) {
    return <NoHouseholdView />;
  }

  return <HouseholdDashboard householdId={household.id} householdName={household.name} currentUserId={myId} inviteCode={household.invite_code} />;
}

function NoHouseholdView() {
  return (
    <ScrollView contentContainerStyle={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏡</Text>
      <Text style={styles.emptyTitle}>Tu hogar compartido</Text>
      <Text style={styles.emptySubtitle}>
        Crea un hogar e invita a tus compañeros de piso para gestionar los gastos juntos.
      </Text>
      <Pressable style={styles.primaryBtn} onPress={() => router.push("/household/create")} accessibilityLabel="Crear hogar">
        <Text style={styles.primaryBtnText}>＋ Crear hogar</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push("/household/join")} accessibilityLabel="Unirse con código">
        <Text style={styles.secondaryBtnText}>🔑 Unirse con código de invitación</Text>
      </Pressable>
    </ScrollView>
  );
}

function HouseholdDashboard({
  householdId, householdName, currentUserId, inviteCode,
}: {
  householdId: string;
  householdName: string;
  currentUserId: string;
  inviteCode: string;
}) {
  const { data: expenses = [], isLoading: loadingExp, refetch } = useExpenses(householdId);
  const { data: balancesData, isLoading: loadingBal } = useBalances(householdId);
  const { data: members = [] } = useHouseholdMembers(householdId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Group expenses by month (YYYY-MM)
  const byMonth = expenses.reduce<Record<string, typeof expenses>>((acc, e) => {
    const key = e.date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <View style={styles.screen}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header info */}
        <View style={styles.householdHeader}>
          <View>
            <Text style={styles.householdName}>{householdName}</Text>
            <Text style={styles.inviteCode}>Código de invitación: {inviteCode}</Text>
          </View>
          <Text style={styles.memberCount}>{members.length} miembro{members.length !== 1 ? "s" : ""}</Text>
        </View>

        {/* Balances */}
        <Text style={styles.sectionTitle}>Balances</Text>
        {loadingBal ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing[4] }} />
        ) : balancesData ? (
          <BalanceCard data={balancesData} currentUserId={currentUserId} />
        ) : null}

        {/* Expenses list by month */}
        <Text style={styles.sectionTitle}>Historial de gastos</Text>
        {loadingExp ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing[4] }} />
        ) : expenses.length === 0 ? (
          <View style={styles.emptyExpenses}>
            <Text style={styles.emptyExpensesText}>Sin gastos todavía. ¡Añade el primero!</Text>
          </View>
        ) : (
          Object.entries(byMonth).map(([month, items]) => (
            <View key={month} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{formatMonth(month)}</Text>
              {items.map((e) => (
                <ExpenseItem
                  key={e.id}
                  expense={e}
                  currentUserId={currentUserId}
                  householdId={householdId}
                />
              ))}
              <Text style={styles.monthTotal}>
                Total: €{items.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setSheetOpen(true)} accessibilityLabel="Añadir gasto">
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      <AddExpenseSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        householdId={householdId}
        currentUserId={currentUserId}
        members={members}
      />
    </View>
  );
}

function formatMonth(ym: string) {
  const [year, month] = ym.split("-");
  const names = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${names[parseInt(month, 10) - 1]} ${year}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  scrollContent: { padding: spacing[4], paddingBottom: 100, gap: spacing[3] },

  householdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  householdName: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
  inviteCode: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  memberCount: { fontSize: fontSize.sm, color: colors.textSecondary },

  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text, marginTop: spacing[2] },

  monthGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthLabel: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textSecondary, marginBottom: spacing[2] },
  monthTotal: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing[2],
    textAlign: "right",
  },

  emptyExpenses: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[6],
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyExpensesText: { color: colors.textSecondary, fontSize: fontSize.sm },

  // No household
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing[8], gap: spacing[4] },
  emptyIcon: { fontSize: 72 },
  emptyTitle: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text, textAlign: "center" },
  emptySubtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    width: "100%",
    alignItems: "center",
  },
  primaryBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.md },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "600", fontSize: fontSize.md },

  fab: {
    position: "absolute",
    bottom: spacing[6],
    right: spacing[5],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: colors.white, fontSize: 28, lineHeight: 32 },
});
