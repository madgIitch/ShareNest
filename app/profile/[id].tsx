import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { useProfile } from "../../src/hooks/useProfile";
import { useMutualFriends } from "../../src/hooks/useConnections";
import { useMyListings } from "../../src/hooks/useListings";
import { useAuth } from "../../src/providers/AuthProvider";
import { useIsSuperfriendz } from "../../src/hooks/useSubscription";
import { colors, fontSize, radius, spacing } from "../../src/theme";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAge(birthYear: number | null | undefined): string {
  if (!birthYear) return "";
  return `${new Date().getFullYear() - birthYear} años`;
}

function scheduleLabel(v: string | null | undefined) {
  if (v === "madrugador") return "Madrugador";
  if (v === "nocturno") return "Nocturno";
  if (v === "flexible") return "Flexible";
  return null;
}

function cleanlinessLabel(v: number | null | undefined) {
  if (!v) return null;
  if (v >= 4) return "Muy ordenado";
  if (v === 3) return "Ordenado";
  return "Relajado";
}

function noiseLevelLabel(v: number | null | undefined) {
  if (!v) return null;
  if (v <= 2) return "Silencioso";
  if (v === 3) return "Moderado";
  return "Animado";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LifestyleItem({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <View style={styles.lifestyleItem}>
      <Text style={[styles.lifestyleIcon, !active && styles.lifestyleIconOff]}>{icon}</Text>
      <Text style={[styles.lifestyleLabel, !active && styles.lifestyleLabelOff]}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;

  const { data: profile, isLoading, isError } = useProfile(id);
  const { data: mutual = [] } = useMutualFriends(myId, id);
  const { data: theirListings = [] } = useMyListings(id);
  const { data: isSuper = false } = useIsSuperfriendz();

  const activeListings = theirListings.filter((l) => l.status === "active");
  const isOwnProfile = myId === id;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  const age = getAge(profile.birth_year);
  const subtitleParts = [age, profile.occupation, profile.city].filter(Boolean);

  // Lifestyle grid items
  const lifestyle = [
    {
      icon: scheduleLabel(profile.schedule) ? "🌅" : "🌅",
      label: scheduleLabel(profile.schedule) ?? "—",
      active: !!profile.schedule,
    },
    {
      icon: "✨",
      label: cleanlinessLabel(profile.cleanliness) ?? "—",
      active: !!profile.cleanliness,
    },
    {
      icon: "💻",
      label: profile.works_from_home ? "Teletrabajo" : "Oficina",
      active: profile.works_from_home != null,
    },
    {
      icon: "🔊",
      label: noiseLevelLabel(profile.noise_level) ?? "—",
      active: !!profile.noise_level,
    },
    {
      icon: profile.has_pets ? "🐾" : "🚫",
      label: profile.has_pets ? "Con mascotas" : "Sin mascotas",
      active: !profile.has_pets,
    },
    {
      icon: profile.smokes ? "🚬" : "🚭",
      label: profile.smokes ? "Fuma" : "No fuma",
      active: !profile.smokes,
    },
  ];

  const hasLifestyle = lifestyle.some((l) => l.active);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ── Cabecera ── */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <UserAvatar
              avatarUrl={profile.avatar_url}
              name={profile.full_name}
              size="xl"
              verified={!!profile.verified_at}
            />
          </View>

          <Text style={styles.fullName}>{profile.full_name ?? "Sin nombre"}</Text>
          {subtitleParts.length > 0 && (
            <Text style={styles.subtitle}>{subtitleParts.join(" · ")}</Text>
          )}

          {/* Badges de fiabilidad */}
          <View style={styles.badgeRow}>
            {profile.verified_at && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✓ Verificado</Text>
              </View>
            )}
            {isSuper && (
              <View style={[styles.badge, styles.badgePurple]}>
                <Text style={[styles.badgeText, styles.badgeTextPurple]}>Superfriendz</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Resp. &lt;1h</Text>
            </View>
          </View>
        </View>

        {/* ── Conexiones mutuas — PRIMER BLOQUE ── */}
        {mutual.length > 0 && (
          <View style={styles.mutualBanner}>
            <Text style={styles.mutualCount}>
              {mutual.length} {mutual.length === 1 ? "amigo en común" : "amigos en común"}
            </Text>
            <Text style={styles.mutualNames} numberOfLines={1}>
              {mutual
                .slice(0, 3)
                .map((f) => f.full_name ?? f.username ?? "Usuario")
                .join(", ")}
              {mutual.length > 3 ? ` y ${mutual.length - 3} más` : ""}{" "}
              os conocen
            </Text>
          </View>
        )}

        {/* ── Bio ── */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Sobre mí</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {/* ── Estilo de vida ── */}
        {hasLifestyle && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Estilo de vida</Text>
            <View style={styles.lifestyleGrid}>
              {lifestyle.map((item, i) => (
                <View key={i} style={styles.lifestyleCell}>
                  <LifestyleItem {...item} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Pisos publicados ── */}
        {activeListings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pisos publicados</Text>
            {activeListings.map((listing) => (
              <Pressable
                key={listing.id}
                style={styles.listingCard}
                onPress={() => router.push(`/listing/${listing.id}`)}
              >
                <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                <Text style={styles.listingMeta}>
                  {listing.price} €/mes · {listing.city}
                  {listing.district ? ` · ${listing.district}` : ""} · Activo
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Bottom padding for sticky footer */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── CTA anclado ── */}
      {!isOwnProfile && myId && (
        <View style={styles.footer}>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => {
              if (activeListings.length > 0) {
                router.push(`/listing/${activeListings[0].id}`);
              }
            }}
          >
            <Text style={styles.ctaBtnText}>
              {activeListings.length > 0 ? "Solicitar habitación" : "Enviar mensaje"}
            </Text>
          </Pressable>
          <Pressable style={styles.moreBtn}>
            <Text style={styles.moreBtnText}>···</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorText: { color: colors.textSecondary, fontSize: fontSize.md },
  container: {
    padding: spacing[4],
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: spacing[3],
  },

  // Header
  header: {
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    padding: spacing[5],
    alignItems: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: { marginBottom: spacing[1] },
  fullName: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[2],
    marginTop: spacing[1],
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  badgePurple: {
    borderColor: colors.purple,
    backgroundColor: colors.purpleLight,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  badgeTextPurple: {
    color: colors.purple,
  },

  // Mutual connections banner
  mutualBanner: {
    backgroundColor: colors.purpleLight,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: 2,
    borderWidth: 1,
    borderColor: colors.purple + "33",
  },
  mutualCount: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.purple,
  },
  mutualNames: {
    fontSize: fontSize.xs,
    color: colors.purple,
    opacity: 0.8,
  },

  // Section
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    padding: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },

  // Lifestyle grid
  lifestyleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  lifestyleCell: {
    width: "47%",
  },
  lifestyleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  lifestyleIcon: {
    fontSize: 16,
  },
  lifestyleIconOff: {
    opacity: 0.4,
  },
  lifestyleLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  lifestyleLabelOff: {
    color: colors.textSecondary,
  },

  // Listing card
  listingCard: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  listingTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
  listingMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },

  // Footer CTA
  footer: {
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaBtn: {
    flex: 1,
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  ctaBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.md,
  },
  moreBtn: {
    width: 50,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  moreBtnText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
});
