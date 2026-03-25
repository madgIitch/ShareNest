import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { useMutualFriends, useMyFriendz } from "../../src/hooks/useConnections";
import { useMyListings } from "../../src/hooks/useListings";
import { useProfile } from "../../src/hooks/useProfile";
import { useIsSuperfriendz } from "../../src/hooks/useSubscription";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";

function getAge(birthYear: number | null | undefined): string {
  if (!birthYear) return "";
  const years = new Date().getFullYear() - birthYear;
  if (years <= 0 || years > 120) return "";
  return `${years} años`;
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

function LifestyleItem({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <View style={styles.lifestyleItem}>
      <Text style={[styles.lifestyleIcon, !active && styles.lifestyleIconOff]}>{icon}</Text>
      <Text style={[styles.lifestyleLabel, !active && styles.lifestyleLabelOff]}>{label}</Text>
    </View>
  );
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;

  const { data: profile, isLoading, isError } = useProfile(id);
  const { data: mutual = [] } = useMutualFriends(myId, id);
  const { data: myFriendz = [] } = useMyFriendz(myId);
  const { data: theirListings = [] } = useMyListings(id);
  const { data: isSuper = false } = useIsSuperfriendz();

  const activeListings = theirListings.filter((l) => l.status === "active");
  const isOwnProfile = myId === id;
  const bannerConnections = isOwnProfile ? myFriendz : mutual;

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

  const lifestyle = [
    { icon: "Sol", label: scheduleLabel(profile.schedule) ?? "-", active: !!profile.schedule },
    { icon: "Limp", label: cleanlinessLabel(profile.cleanliness) ?? "-", active: !!profile.cleanliness },
    {
      icon: "WFH",
      label: profile.works_from_home ? "Teletrabajo" : "Oficina",
      active: profile.works_from_home != null,
    },
    { icon: "Ruido", label: noiseLevelLabel(profile.noise_level) ?? "-", active: !!profile.noise_level },
    {
      icon: "Masc",
      label: profile.has_pets ? "Con mascotas" : "Sin mascotas",
      active: profile.has_pets != null,
    },
    { icon: "Fuma", label: profile.smokes ? "Fuma" : "No fuma", active: profile.smokes != null },
  ];

  const hasLifestyle = lifestyle.some((l) => l.active);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <UserAvatar avatarUrl={profile.avatar_url} name={profile.full_name} size="xl" verified={!!profile.verified_at} />
          </View>

          <Text style={styles.fullName}>{profile.full_name ?? "Sin nombre"}</Text>
          {subtitleParts.length > 0 && <Text style={styles.subtitle}>{subtitleParts.join(" · ")}</Text>}

          <View style={styles.badgeRow}>
            {!!profile.verified_at && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Verificado</Text>
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

        {bannerConnections.length > 0 && (
          <View style={styles.mutualBanner}>
            <Text style={styles.mutualCount}>
              {isOwnProfile
                ? `${bannerConnections.length} ${bannerConnections.length === 1 ? "conexion" : "conexiones"}`
                : `${bannerConnections.length} ${bannerConnections.length === 1 ? "amigo en comun" : "amigos en comun"}`}
            </Text>
            <Text style={styles.mutualNames} numberOfLines={1}>
              {isOwnProfile ? "Tus conexiones: " : ""}
              {bannerConnections
                .slice(0, 3)
                .map((f) => f.full_name ?? f.username ?? "Usuario")
                .join(", ")}
              {bannerConnections.length > 3 ? ` y ${bannerConnections.length - 3} mas` : ""}
              {!isOwnProfile ? " os conocen" : ""}
            </Text>
          </View>
        )}

        {!!profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Sobre mi</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {!!profile.photos?.length && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Fotos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
              {profile.photos.map((uri, index) => (
                <Image key={`${uri}-${index}`} source={{ uri }} style={styles.photoThumb} />
              ))}
            </ScrollView>
          </View>
        )}

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

        {activeListings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pisos publicados</Text>
            {activeListings.map((listing) => (
              <Pressable key={listing.id} style={styles.listingCard} onPress={() => router.push(`/listing/${listing.id}`)}>
                <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                <Text style={styles.listingMeta}>
                  {listing.price} EUR/mes · {listing.city_name ?? listing.city ?? ""}
                  {listing.district_name ?? listing.district ? ` · ${listing.district_name ?? listing.district}` : ""} · Activo
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {!isOwnProfile && myId && (
        <View style={styles.footer}>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => {
              if (activeListings.length > 0) router.push(`/listing/${activeListings[0].id}`);
            }}
          >
            <Text style={styles.ctaBtnText}>{activeListings.length > 0 ? "Solicitar habitacion" : "Enviar mensaje"}</Text>
          </Pressable>
          <Pressable style={styles.moreBtn}>
            <Text style={styles.moreBtnText}>...</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

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
  photosRow: { gap: spacing[2] },
  photoThumb: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.gray100 },

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
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textSecondary,
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
    letterSpacing: 1,
  },
});
