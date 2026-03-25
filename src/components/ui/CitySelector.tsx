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
import { locationService, type City } from "../../services/locationService";

type Props = {
  value: string;
  onSelect: (city: City) => void;
  placeholder?: string;
};

export function CitySelector({ value, onSelect, placeholder = "Seleccionar ciudad" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCities = (q: string) => {
    setLoading(true);
    const opts = q ? { limit: 20 } : { top: true, limit: 12 };
    locationService.getCities(q, opts)
      .then(setCities)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Load top cities when sheet opens
  useEffect(() => {
    if (open) loadCities("");
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => loadCities(query), 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  const handleClose = () => { setOpen(false); setQuery(""); };

  const handleSelect = (city: City) => {
    onSelect(city);
    locationService.trackCitySearch(city.id);
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
            placeholder="Buscar ciudad..."
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
            data={cities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, item.name === value && styles.itemSelected]}
                onPress={() => handleSelect(item)}
              >
                <Text style={[styles.itemText, item.name === value && styles.itemTextSelected]}>
                  {item.name}
                </Text>
                {item.name === value && <Text style={styles.check}>✓</Text>}
              </Pressable>
            )}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              query.length > 0 ? (
                <Text style={styles.empty}>Sin resultados para "{query}"</Text>
              ) : null
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
  triggerText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  chevron: {
    fontSize: 20,
    color: colors.textTertiary,
  },
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
  list: {
    paddingBottom: spacing[8],
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemSelected: {
    backgroundColor: colors.primaryLight,
  },
  itemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  itemTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  check: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  empty: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    paddingVertical: spacing[4],
  },
});
