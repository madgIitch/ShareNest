// src/components/ui/ListingCluster.tsx
// Burbuja de cluster para el mapa.
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, radius } from "../../theme";

type Props = {
  count: number;
  onPress?: () => void;
};

export function ListingCluster({ count, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Grupo de ${count} anuncios`}
      style={styles.cluster}
    >
      <Text style={styles.label}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cluster: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
});
