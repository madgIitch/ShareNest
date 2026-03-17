import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { ConnectionButton } from "../../src/components/social/ConnectionButton";
import { useProfile } from "../../src/hooks/useProfile";
import { useMutualFriends } from "../../src/hooks/useConnections";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;

  const { data: profile, isLoading, isError } = useProfile(id);
  const { data: mutual = [] } = useMutualFriends(myId, id);

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

  const isOwnProfile = myId === id;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(profile.full_name ?? profile.username ?? "?")[0].toUpperCase()}
            </Text>
          </View>
        )}
        {profile.verified_at && (
          <View style={styles.verifyDot}>
            <Text style={{ color: colors.white, fontSize: 10, fontWeight: "700" }}>✓</Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={styles.fullName}>{profile.full_name ?? "Sin nombre"}</Text>
      {profile.username && <Text style={styles.username}>@{profile.username}</Text>}
      {profile.city && <Text style={styles.city}>📍 {profile.city}</Text>}

      {/* Connect button */}
      {!isOwnProfile && myId && (
        <View style={styles.actionRow}>
          <ConnectionButton myId={myId} otherId={id} />
        </View>
      )}

      {/* Mutual friends */}
      {mutual.length > 0 && (
        <View style={styles.mutualCard}>
          <Text style={styles.mutualTitle}>
            {mutual.length} {mutual.length === 1 ? "amigo en común" : "amigos en común"}
          </Text>
          <View style={styles.mutualAvatars}>
            {mutual.slice(0, 5).map((f, i) => (
              <Pressable
                key={f.id}
                style={[styles.mutualAvatarWrap, { marginLeft: i === 0 ? 0 : -10 }]}
                onPress={() => router.push(`/profile/${f.id}`)}
              >
                <UserAvatar avatarUrl={f.avatar_url} name={f.full_name} size="sm" />
              </Pressable>
            ))}
            {mutual.length > 5 && (
              <View style={[styles.mutualAvatarWrap, styles.mutualMore, { marginLeft: -10 }]}>
                <Text style={styles.mutualMoreText}>+{mutual.length - 5}</Text>
              </View>
            )}
          </View>
          <Text style={styles.mutualNames} numberOfLines={1}>
            {mutual
              .slice(0, 3)
              .map((f) => f.full_name ?? f.username ?? "Usuario")
              .join(", ")}
            {mutual.length > 3 ? ` y ${mutual.length - 3} más` : ""}
          </Text>
        </View>
      )}

      {/* Bio */}
      {profile.bio && (
        <View style={styles.bioCard}>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      )}
    </ScrollView>
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
    padding: spacing[6],
    alignItems: "center",
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: spacing[3],
  },
  avatarWrap: { position: "relative", marginBottom: spacing[1] },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  avatarInitial: { fontSize: 36, fontWeight: "700", color: colors.primary },
  verifyDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.verify,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  fullName: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text, textAlign: "center" },
  username: { fontSize: fontSize.sm, color: colors.textSecondary },
  city: { fontSize: fontSize.sm, color: colors.textSecondary },
  actionRow: { flexDirection: "row", gap: spacing[2], marginTop: spacing[1] },

  mutualCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    padding: spacing[4],
    gap: spacing[2],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  mutualTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  mutualAvatars: { flexDirection: "row", alignItems: "center" },
  mutualAvatarWrap: { borderWidth: 2, borderColor: colors.surface, borderRadius: 20 },
  mutualMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  mutualMoreText: { fontSize: 10, fontWeight: "700", color: colors.primary },
  mutualNames: { fontSize: fontSize.xs, color: colors.textSecondary },

  bioCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    padding: spacing[4],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bioText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 22 },
});
