import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ListingCard } from "../../src/components/ui/ListingCard";
import type { ListingPreview } from "../../src/components/ui/ListingCard";
import { CitySelector } from "../../src/components/ui/CitySelector";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { ListingCardSkeleton } from "../../src/components/ui/Skeleton";
import { useActiveListings } from "../../src/hooks/useListings";
import { colors, fontSize, spacing } from "../../src/theme";
import type { Database } from "../../src/types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

function listingToPreview(l: Listing): ListingPreview {
  return {
    id: l.id,
    title: l.title,
    price: l.price,
    city: l.city,
    type: l.type,
    image_url: (l.images as string[])[0] ?? null,
    tags: [
      ...(l.is_furnished ? ["Amueblado"] : []),
      ...(l.pets_allowed ? ["Mascotas OK"] : []),
      ...(l.smokers_allowed ? ["Fumadores OK"] : []),
    ],
  };
}

const TYPE_FILTERS = [
  { key: undefined, label: "Todos" },
  { key: "offer", label: "Ofrezco" },
  { key: "search", label: "Busco" },
] as const;

export default function ExploreScreen() {
  const [city, setCity] = useState("");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"offer" | "search" | undefined>(undefined);

  const { data: listings, isLoading, refetch } = useActiveListings(city || undefined);

  const filtered = (listings ?? []).filter(
    (l) => !typeFilter || l.type === typeFilter,
  );

  return (
    <View style={styles.screen}>
      {/* Barra de búsqueda / filtros */}
      <View style={styles.filterBar}>
        <Pressable
          style={styles.cityButton}
          onPress={() => setCityPickerOpen(true)}
        >
          <Text style={[styles.cityButtonText, !city && styles.cityPlaceholder]}>
            📍 {city || "Todas las ciudades"}
          </Text>
          {city ? (
            <Pressable
              onPress={() => setCity("")}
              hitSlop={8}
            >
              <Text style={styles.clearCity}>✕</Text>
            </Pressable>
          ) : null}
        </Pressable>

        <View style={styles.typeFilters}>
          {TYPE_FILTERS.map((f) => (
            <Pressable
              key={String(f.key)}
              style={[styles.typeChip, typeFilter === f.key && styles.typeChipActive]}
              onPress={() => setTypeFilter(f.key)}
            >
              <Text style={[styles.typeChipText, typeFilter === f.key && styles.typeChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* CitySelector (hidden trigger) */}
      {cityPickerOpen && (
        <View style={styles.citySelectorOverlay}>
          <CitySelector
            value={city}
            onChange={(v) => { setCity(v); setCityPickerOpen(false); }}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={listingToPreview(item)}
              onPress={() => router.push(`/listing/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="🏡"
              title="Sin resultados"
              subtitle={
                city
                  ? `No hay anuncios activos en ${city}.`
                  : "Aún no hay anuncios. ¡Sé el primero!"
              }
              action={
                city ? { label: "Ver todas las ciudades", onPress: () => setCity("") } : undefined
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filterBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing[3],
    gap: spacing[2],
  },
  cityButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.gray100,
    borderRadius: 9999,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
  },
  cityButtonText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "500",
  },
  cityPlaceholder: {
    color: colors.textTertiary,
  },
  clearCity: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: "600",
    paddingLeft: spacing[2],
  },
  typeFilters: {
    flexDirection: "row",
    gap: spacing[2],
  },
  typeChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: 9999,
    backgroundColor: colors.gray100,
  },
  typeChipActive: {
    backgroundColor: colors.primaryLight,
  },
  typeChipText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.primary,
  },
  citySelectorOverlay: {
    position: "absolute",
    top: 80,
    left: spacing[3],
    right: spacing[3],
    zIndex: 10,
  },
  list: {
    padding: spacing[4],
    gap: spacing[3],
  },
});
