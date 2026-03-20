import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, fontSize, radius, spacing } from "../../theme";
import { BottomSheet } from "./BottomSheet";
import { locationService, type Place } from "../../services/locationService";

type Props = {
  cityId: string;
  value: string;
  onSelect: (place: Place) => void;
  placeholder?: string;
};

export function DistrictSelector({
  cityId,
  value,
  onSelect,
  placeholder = "Seleccionar barrio (opcional)",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPlaces = (q: string) => {
    setLoading(true);
    locationService.getPlaces(cityId, q, { limit: 20 })
      .then(setPlaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) loadPlaces("");
  }, [open, cityId]);

  useEffect(() => {
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => loadPlaces(query), 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  const handleClose = () => { setOpen(false); setQuery(""); };

  const handleSelect = (place: Place) => {
    onSelect(place);
    handleClose();
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <BottomSheet visible={open} onClose={handleClose} snapPoint={500}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.search}
            placeholder="Buscar barrio o distrito..."
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[4] }} />
        ) : (
          <FlatList
            data={places}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, item.name === value && styles.itemSelected]}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.itemContent}>
                  <Text style={[styles.itemText, item.name === value && styles.itemTextSelected]}>
                    {item.name}
                  </Text>
                  {item.place && (
                    <Text style={styles.itemSub}>{item.place}</Text>
                  )}
                </View>
                {item.name === value && <Text style={styles.check}>✓</Text>}
              </Pressable>
            )}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {query.length > 0
                  ? `Sin resultados para "${query}"`
                  : "No hay barrios registrados para esta ciudad"}
              </Text>
            }
          />
        )}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
  },
  triggerText: { fontSize: fontSize.md, color: colors.text },
  placeholder: { color: colors.textTertiary },
  chevron: { fontSize: 20, color: colors.textTertiary },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
    fontSize: fontSize.md,
    backgroundColor: colors.gray50,
  },
  list: { paddingBottom: spacing[8] },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemSelected: { backgroundColor: colors.primaryLight },
  itemContent: { flex: 1 },
  itemText: { fontSize: fontSize.md, color: colors.text },
  itemTextSelected: { color: colors.primary, fontWeight: "600" },
  itemSub: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 1 },
  check: { color: colors.primary, fontWeight: "700", fontSize: fontSize.md },
  empty: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
});
