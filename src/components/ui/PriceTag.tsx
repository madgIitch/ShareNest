import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../../theme";

type Props = {
  amount: number;
  currency?: string;
  period?: "mes" | "semana" | "día" | "noche";
  size?: "sm" | "md" | "lg";
};

const SIZE_STYLES = {
  sm: { amount: fontSize.md, period: fontSize.xs },
  md: { amount: fontSize.xl, period: fontSize.sm },
  lg: { amount: fontSize["2xl"], period: fontSize.md },
};

export function PriceTag({ amount, currency = "€", period = "mes", size = "md" }: Props) {
  const s = SIZE_STYLES[size];
  return (
    <View style={styles.container}>
      <Text style={[styles.amount, { fontSize: s.amount }]}>
        {currency}
        {amount.toLocaleString("es-ES")}
      </Text>
      <Text style={[styles.period, { fontSize: s.period }]}>/{period}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[1],
  },
  amount: {
    fontWeight: "700",
    color: colors.primary,
  },
  period: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
