import { ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "../../src/components/ui/EmptyState";
import { ListingCardSkeleton } from "../../src/components/ui/Skeleton";
import { colors, fontSize, spacing } from "../../src/theme";

export default function ExploreScreen() {
  // Sprint 4 implementará la búsqueda real
  const isLoading = false;
  const hasListings = false;

  return (
    <View style={styles.screen}>
      {/* Search bar placeholder */}
      <View style={styles.searchBar}>
        <Text style={styles.searchText}>🔍  Buscar por ciudad, precio...</Text>
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.grid}>
          {[1, 2, 3].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </ScrollView>
      ) : !hasListings ? (
        <EmptyState
          icon="🏡"
          title="Aún no hay anuncios"
          subtitle="Vuelve pronto — los primeros pisos están en camino."
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    margin: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  grid: {
    padding: spacing[4],
    gap: spacing[3],
  },
});
