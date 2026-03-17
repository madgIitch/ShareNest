// src/hooks/useExpenses.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type ExpenseCategory = "luz" | "agua" | "gas" | "internet" | "comida" | "limpieza" | "otros";
export type SplitType = "equal" | "custom";

export type Expense = {
  id: string;
  household_id: string;
  paid_by: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  receipt_url: string | null;
  date: string;
  split_type: SplitType;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  is_settled: boolean;
  settled_at: string | null;
};

export type BalanceTransfer = {
  from: string;
  to: string;
  amount: number;
};

export type BalancesResult = {
  balances: Array<{ user_id: string; net_balance: number }>;
  transfers: BalanceTransfer[];
  profiles: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
};

const EXPENSES_KEY = (householdId: string) => ["expenses", householdId];
const BALANCES_KEY = (householdId: string) => ["balances", householdId];
const SUPABASE_FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

export function useExpenses(householdId: string | undefined) {
  return useQuery({
    queryKey: EXPENSES_KEY(householdId ?? ""),
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, profiles(full_name, avatar_url)")
        .eq("household_id", householdId!)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });
}

export function useExpenseSplits(expenseId: string | undefined) {
  return useQuery({
    queryKey: ["expense_splits", expenseId],
    enabled: !!expenseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_splits")
        .select("*")
        .eq("expense_id", expenseId!);
      if (error) throw error;
      return (data ?? []) as ExpenseSplit[];
    },
  });
}

export function useBalances(householdId: string | undefined) {
  return useQuery({
    queryKey: BALANCES_KEY(householdId ?? ""),
    enabled: !!householdId,
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? "";
      const res = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/calculate-balances?household_id=${householdId}`,
        { headers: { Authorization: `Bearer ${token}`, apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "" } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as BalancesResult;
    },
    staleTime: 1000 * 30,
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      householdId,
      paidBy,
      amount,
      category,
      description,
      receiptUrl,
      date,
      splitType,
      memberIds,
      customSplits,
    }: {
      householdId: string;
      paidBy: string;
      amount: number;
      category: ExpenseCategory;
      description?: string;
      receiptUrl?: string;
      date: string;
      splitType: SplitType;
      memberIds: string[];
      customSplits?: Record<string, number>;
    }) => {
      // Insert expense
      const { data: expense, error: expErr } = await supabase
        .from("expenses")
        .insert({
          household_id: householdId,
          paid_by: paidBy,
          amount,
          category,
          description: description ?? null,
          receipt_url: receiptUrl ?? null,
          date,
          split_type: splitType,
        })
        .select("id")
        .single();
      if (expErr) throw expErr;

      // Build splits
      const splits = memberIds.map((uid) => {
        const share = splitType === "equal"
          ? Math.round((amount / memberIds.length) * 100) / 100
          : (customSplits?.[uid] ?? 0);
        return { expense_id: expense.id, user_id: uid, amount: share };
      });

      const { error: splitErr } = await supabase.from("expense_splits").insert(splits);
      if (splitErr) throw splitErr;

      return expense.id as string;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: EXPENSES_KEY(vars.householdId) });
      qc.invalidateQueries({ queryKey: BALANCES_KEY(vars.householdId) });
    },
  });
}

export function useSettleSplit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ splitId, householdId }: { splitId: string; householdId: string }) => {
      const { error } = await supabase
        .from("expense_splits")
        .update({ is_settled: true, settled_at: new Date().toISOString() })
        .eq("id", splitId);
      if (error) throw error;
      return householdId;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: EXPENSES_KEY(vars.householdId) });
      qc.invalidateQueries({ queryKey: BALANCES_KEY(vars.householdId) });
    },
  });
}
