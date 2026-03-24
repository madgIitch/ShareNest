import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useMutualFriends } from "../../hooks/useConnections";
import { colors, fontSize, radius, spacing } from "../../theme";

export type ListingPreview = {
  id: string;
  owner_id?: string;
  title: string;
  price: number;
  city: string;
  type?: "offer" | "search";
  image_url: string | null;
  tags?: string[];
  owner?: {
    full_name: string | null;
    avatar_url: string | null;
    verified_at: string | null;
  };
};

type Props = {
  listing: ListingPreview;
  connectionDegree?: 1 | 2 | null;
  viewerId?: string;
  onPress?: () => void;
};

export function ListingCard({ listing, connectionDegree, viewerId, onPress }: Props) {
  const ownerId = listing.owner_id;
  const { data: mutual = [] } = useMutualFriends(
    viewerId,
    ownerId && ownerId !== viewerId ? ownerId : undefined,
  );

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.imageContainer}>
        {listing.image_url ? (
          <Image source={{ uri: listing.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>{"\u{1F3E0}"}</Text>
          </View>
        )}

        {listing.type && (
          <View
            style={[
              styles.typeBadge,
              listing.type === "offer" ? styles.typeBadgeOffer : styles.typeBadgeSearch,
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                listing.type === "offer" ? styles.typeBadgeTextOffer : styles.typeBadgeTextSearch,
              ]}
            >
              {listing.type === "offer" ? "Ofrezco" : "Busco"}
            </Text>
          </View>
        )}

        {connectionDegree != null && (
          <View
            style={[
              styles.friendzBadge,
              connectionDegree === 1 ? styles.friendzBadge1 : styles.friendzBadge2,
            ]}
          >
            <Text
              style={[
                styles.friendzBadgeText,
                connectionDegree === 1 ? styles.friendzBadgeText1 : styles.friendzBadgeText2,
              ]}
            >
              {connectionDegree === 1 ? "Friendz" : "Amigo de amigo"}
            </Text>
          </View>
        )}

        <Pressable style={styles.likeBtn} hitSlop={8}>
          <Text style={styles.likeBtnText}>{"\u2661"}</Text>
        </Pressable>

        <View style={styles.priceOverlay} pointerEvents="none">
          <View style={styles.priceFadeTop} />
          <View style={styles.priceFadeMid} />
          <View style={styles.priceFadeBottom} />
          <Text style={styles.priceOverlayAmount}>EUR {listing.price}/mes</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.city}>{"\u{1F4CD}"} {listing.city}</Text>

        {mutual.length > 0 && (
          <View style={styles.mutualRow}>
            <View style={styles.mutualAvatars}>
              {mutual.slice(0, 3).map((f, idx) => (
                <View key={f.id} style={[styles.mutualAvatarWrap, { marginLeft: idx === 0 ? 0 : -8 }]}>
                  {f.avatar_url ? (
                    <Image source={{ uri: f.avatar_url }} style={styles.mutualAvatar} />
                  ) : (
                    <View style={[styles.mutualAvatar, styles.mutualAvatarPlaceholder]}>
                      <Text style={styles.mutualAvatarInitial}>
                        {(f.full_name ?? "?").slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <Text style={styles.mutualText}>
              {mutual.length} {mutual.length === 1 ? "amigo en comun" : "amigos en comun"}
            </Text>
          </View>
        )}

        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: { opacity: 0.92 },

  imageContainer: {
    height: 200,
    backgroundColor: colors.gray100,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
  },
  imagePlaceholderIcon: { fontSize: 40 },

  typeBadge: {
    position: "absolute",
    top: spacing[2],
    left: spacing[2],
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  typeBadgeOffer: { backgroundColor: colors.gray900 },
  typeBadgeSearch: { backgroundColor: colors.verifyLight },
  typeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  typeBadgeTextOffer: { color: colors.white },
  typeBadgeTextSearch: { color: colors.verify },

  friendzBadge: {
    position: "absolute",
    bottom: spacing[2],
    left: spacing[2],
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  friendzBadge1: { backgroundColor: colors.primaryLight },
  friendzBadge2: { backgroundColor: "rgba(255,255,255,0.85)" },
  friendzBadgeText: { fontSize: fontSize.xs, fontWeight: "700" },
  friendzBadgeText1: { color: colors.primaryDark },
  friendzBadgeText2: { color: colors.textSecondary },

  likeBtn: {
    position: "absolute",
    top: spacing[2],
    right: spacing[2],
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  likeBtnText: {
    fontSize: 16,
    color: colors.gray600,
    lineHeight: 18,
  },

  priceOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 92,
    justifyContent: "flex-end",
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[2],
  },
  priceFadeTop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 72,
    height: 20,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  priceFadeMid: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 48,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  priceFadeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  priceOverlayAmount: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  body: {
    padding: spacing[3],
    gap: 4,
  },
  city: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  mutualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  mutualAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  mutualAvatarWrap: {
    borderWidth: 1.5,
    borderColor: colors.white,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  mutualAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray200,
  },
  mutualAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
  },
  mutualAvatarInitial: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  mutualText: {
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 20,
  },
});
