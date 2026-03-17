import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, fontSize, radius, spacing } from "../../theme";
import { BottomSheet } from "./BottomSheet";

const CITIES = [
  "Barcelona", "Madrid", "Valencia", "Sevilla", "Bilbao",
  "Málaga", "Zaragoza", "Murcia", "Palma", "Las Palmas",
  "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón",
  "Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne",
  "Amsterdam", "Rotterdam", "Utrecht",
  "Paris", "Lyon", "Marseille",
  "Lisbon", "Porto",
];

type Props = {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
};

export function CitySelector({ value, onChange, placeholder = "Seleccionar ciudad" }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (city: string) => {
    onChange(city);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} snapPoint={480}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.search}
            placeholder="Buscar ciudad..."
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.item, item === value && styles.itemSelected]}
              onPress={() => handleSelect(item)}
            >
              <Text style={[styles.itemText, item === value && styles.itemTextSelected]}>
                {item}
              </Text>
              {item === value && <Text style={styles.check}>✓</Text>}
            </Pressable>
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
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
});
