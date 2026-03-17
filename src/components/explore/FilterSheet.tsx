import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { BottomSheet } from "../ui/BottomSheet";
import { CitySelector } from "../ui/CitySelector";
import { colors, fontSize, radius, spacing } from "../../theme";
import { DEFAULT_FILTERS } from "../../types/filters";
import type { ListingFilters } from "../../types/filters";

type Props = {
  visible: boolean;
  filters: ListingFilters;
  onClose: () => void;
  onApply: (filters: ListingFilters) => void;
};

type Tristate = boolean | undefined;

export function FilterSheet({ visible, filters, onClose, onApply }: Props) {
  // Local draft state — applied only when user taps "Aplicar"
  const [draft, setDraft] = useState<ListingFilters>(filters);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  // Sync draft when sheet opens with latest filters
  const handleOpen = () => setDraft(filters);

  const set = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => setDraft(DEFAULT_FILTERS);

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoint={620}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Filtros</Text>
        <Pressable onPress={handleReset} hitSlop={8}>
          <Text style={styles.resetBtn}>Resetear</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tipo ─────────────────────────────────────────────── */}
        <FilterSection label="Tipo de anuncio">
          <View style={styles.chipRow}>
            {([undefined, "offer", "search"] as const).map((v) => (
              <Pressable
                key={String(v)}
                style={[styles.chip, draft.type === v && styles.chipActive]}
                onPress={() => set("type", v)}
              >
                <Text style={[styles.chipText, draft.type === v && styles.chipTextActive]}>
                  {v === undefined ? "Todos" : v === "offer" ? "Ofrezco" : "Busco"}
                </Text>
              </Pressable>
            ))}
          </View>
        </FilterSection>

        {/* ── Ciudad ───────────────────────────────────────────── */}
        <FilterSection label="Ciudad">
          <Pressable
            style={styles.cityBtn}
            onPress={() => setCityPickerOpen(true)}
          >
            <Text style={[styles.cityBtnText, !draft.city && styles.placeholder]}>
              📍 {draft.city || "Todas las ciudades"}
            </Text>
            {draft.city ? (
              <Pressable onPress={() => set("city", "")} hitSlop={8}>
                <Text style={styles.clearText}>✕</Text>
              </Pressable>
            ) : (
              <Text style={styles.chevron}>›</Text>
            )}
          </Pressable>
          {cityPickerOpen && (
            <CitySelector
              value={draft.city}
              onChange={(v) => { set("city", v); setCityPickerOpen(false); }}
            />
          )}
        </FilterSection>

        {/* ── Precio ───────────────────────────────────────────── */}
        <FilterSection label="Precio (€/mes)">
          <View style={styles.rangeRow}>
            <TextInput
              style={[styles.rangeInput, { flex: 1 }]}
              keyboardType="numeric"
              placeholder="Mín"
              placeholderTextColor={colors.textTertiary}
              value={draft.priceMin?.toString() ?? ""}
              onChangeText={(t) => set("priceMin", t ? parseInt(t) : undefined)}
            />
            <Text style={styles.rangeSep}>—</Text>
            <TextInput
              style={[styles.rangeInput, { flex: 1 }]}
              keyboardType="numeric"
              placeholder="Máx"
              placeholderTextColor={colors.textTertiary}
              value={draft.priceMax?.toString() ?? ""}
              onChangeText={(t) => set("priceMax", t ? parseInt(t) : undefined)}
            />
          </View>
        </FilterSection>

        {/* ── Tamaño mínimo ─────────────────────────────────────── */}
        <FilterSection label="Tamaño mínimo (m²)">
          <TextInput
            style={styles.singleInput}
            keyboardType="numeric"
            placeholder="p.ej. 40"
            placeholderTextColor={colors.textTertiary}
            value={draft.sizeMin?.toString() ?? ""}
            onChangeText={(t) => set("sizeMin", t ? parseInt(t) : undefined)}
          />
        </FilterSection>

        {/* ── Disponible desde ──────────────────────────────────── */}
        <FilterSection label="Disponible antes de">
          <TextInput
            style={styles.singleInput}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={colors.textTertiary}
            value={draft.availableFrom}
            onChangeText={(t) => set("availableFrom", t)}
            maxLength={10}
          />
        </FilterSection>

        {/* ── Mascotas ──────────────────────────────────────────── */}
        <FilterSection label="Mascotas">
          <TriStateRow
            value={draft.petsAllowed}
            onChange={(v) => set("petsAllowed", v)}
          />
        </FilterSection>

        {/* ── Fumadores ─────────────────────────────────────────── */}
        <FilterSection label="Fumadores">
          <TriStateRow
            value={draft.smokersAllowed}
            onChange={(v) => set("smokersAllowed", v)}
          />
        </FilterSection>

        {/* ── Radio geo (only if lat/lng set) ───────────────────── */}
        {draft.lat != null && (
          <FilterSection label={`Radio: ${draft.radiusKm} km desde tu ubicación`}>
            <View style={styles.chipRow}>
              {[10, 30, 50, 100].map((km) => (
                <Pressable
                  key={km}
                  style={[styles.chip, draft.radiusKm === km && styles.chipActive]}
                  onPress={() => set("radiusKm", km)}
                >
                  <Text style={[styles.chipText, draft.radiusKm === km && styles.chipTextActive]}>
                    {km} km
                  </Text>
                </Pressable>
              ))}
            </View>
          </FilterSection>
        )}
      </ScrollView>

      {/* Apply button */}
      <View style={styles.footer}>
        <Pressable style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>Aplicar filtros</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TriStateRow({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
}) {
  const opts: { label: string; v: boolean | undefined }[] = [
    { label: "Indiferente", v: undefined },
    { label: "Sí", v: true },
    { label: "No", v: false },
  ];
  return (
    <View style={styles.chipRow}>
      {opts.map(({ label, v }) => (
        <Pressable
          key={String(v)}
          style={[styles.chip, value === v && styles.chipActive]}
          onPress={() => onChange(v)}
        >
          <Text style={[styles.chipText, value === v && styles.chipTextActive]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  resetBtn: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[6],
  },
  section: {
    gap: spacing[2],
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    borderWidth: 1.5,
    borderColor: colors.transparent,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
  cityBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  cityBtnText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  clearText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: "600",
    paddingLeft: spacing[2],
  },
  chevron: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  rangeSep: {
    color: colors.textTertiary,
    fontSize: fontSize.md,
  },
  rangeInput: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  singleInput: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  footer: {
    padding: spacing[4],
    paddingBottom: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  applyBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
});
