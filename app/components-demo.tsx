import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "../src/components/ui/BottomSheet";
import { CitySelector } from "../src/components/ui/CitySelector";
import { EmptyState } from "../src/components/ui/EmptyState";
import { ImagePickerInput } from "../src/components/ui/ImagePickerInput";
import { ListingCard } from "../src/components/ui/ListingCard";
import type { ListingPreview } from "../src/components/ui/ListingCard";
import { PriceTag } from "../src/components/ui/PriceTag";
import { Skeleton, ListingCardSkeleton } from "../src/components/ui/Skeleton";
import { TagBadge } from "../src/components/ui/TagBadge";
import { UserAvatar } from "../src/components/ui/UserAvatar";
import { useToast } from "../src/providers/ToastProvider";
import { colors, fontSize, spacing } from "../src/theme";
import { ErrorBoundary } from "../src/components/ErrorBoundary";

const MOCK_LISTING: ListingPreview = {
  id: "1",
  title: "Habitación en piso compartido cerca del centro",
  price: 650,
  city: "Barcelona",
  image_url: null,
  tags: ["Amueblado", "Pareja OK", "Mascotas NO"],
  owner: {
    full_name: "Laura García",
    avatar_url: null,
    verified_at: new Date().toISOString(),
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ComponentsDemoScreen() {
  const { show } = useToast();
  const [city, setCity] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>UI Components</Text>

      <Section title="UserAvatar">
        <View style={styles.row}>
          {(["xs", "sm", "md", "lg"] as const).map((size) => (
            <UserAvatar key={size} name="Laura García" size={size} />
          ))}
          <UserAvatar name="Verificado" size="md" verified />
        </View>
      </Section>

      <Section title="TagBadge">
        <View style={styles.row}>
          <TagBadge label="Default" />
          <TagBadge label="Primary" variant="primary" />
          <TagBadge label="Success" variant="success" />
          <TagBadge label="Warning" variant="warning" />
          <TagBadge label="Error" variant="error" />
        </View>
      </Section>

      <Section title="PriceTag">
        <View style={styles.row}>
          <PriceTag amount={650} size="sm" />
          <PriceTag amount={1200} size="md" />
          <PriceTag amount={900} size="lg" period="semana" />
        </View>
      </Section>

      <Section title="ListingCard">
        <ListingCard listing={MOCK_LISTING} onPress={() => show("Listing pulsado", "info")} />
      </Section>

      <Section title="Skeleton">
        <Skeleton width="60%" height={14} />
        <View style={{ height: 8 }} />
        <Skeleton width="90%" height={14} />
        <View style={{ height: 16 }} />
        <ListingCardSkeleton />
      </Section>

      <Section title="EmptyState">
        <View style={{ height: 200 }}>
          <EmptyState
            icon="🏡"
            title="Sin resultados"
            subtitle="Prueba con otra ciudad o filtros diferentes."
            action={{ label: "Limpiar filtros", onPress: () => show("Filtros limpiados", "success") }}
          />
        </View>
      </Section>

      <Section title="CitySelector">
        <CitySelector value={city} onChange={setCity} />
      </Section>

      <Section title="ImagePickerInput">
        <ImagePickerInput uri={imageUri} onPick={setImageUri} />
      </Section>

      <Section title="BottomSheet">
        <View>
          <Text
            style={styles.link}
            onPress={() => setSheetOpen(true)}
          >
            Abrir BottomSheet →
          </Text>
        </View>
        <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} snapPoint={300}>
          <View style={{ padding: spacing[4], gap: spacing[3] }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "700" }}>BottomSheet</Text>
            <TagBadge label="Funciona ✓" variant="success" />
            <Text style={{ color: colors.textSecondary }}>
              Arrastra hacia abajo o toca el fondo para cerrar.
            </Text>
          </View>
        </BottomSheet>
      </Section>

      <Section title="Toast">
        <View style={styles.row}>
          {(["info", "success", "error"] as const).map((type) => (
            <Text
              key={type}
              style={[styles.link, styles.toastBtn]}
              onPress={() => show(`Toast ${type}`, type)}
            >
              {type}
            </Text>
          ))}
        </View>
      </Section>

      <Section title="ErrorBoundary">
        <ErrorBoundary>
          <Text style={{ color: colors.textSecondary }}>
            Sin error — el boundary está activo.
          </Text>
        </ErrorBoundary>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    backgroundColor: colors.background,
    gap: spacing[4],
    paddingBottom: spacing[12],
  },
  heading: {
    fontSize: fontSize["3xl"],
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing[2],
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing[1],
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
    alignItems: "center",
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: fontSize.md,
  },
  toastBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
  },
});
