// src/components/ui/ListingPin.tsx
// Pin de precio para un listing individual en el mapa.
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, radius, spacing } from "../../theme";

type Props = {
  price: number;
  currency?: string;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function ListingPin({
  price,
  currency = "€",
  isSelected = false,
  isHighlighted = false,
  onPress,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${currency}${price}`}
      style={[
        styles.pin,
        isSelected && styles.pinSelected,
        isHighlighted && styles.pinHighlighted,
      ]}
    >
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {currency}{price}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pin: {
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  pinSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    elevation: 5,
  },
  pinHighlighted: {
    borderWidth: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  labelSelected: {
    color: colors.white,
  },
});
