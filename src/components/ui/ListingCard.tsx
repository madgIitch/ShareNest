import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../../theme";
import { PriceTag } from "./PriceTag";

export type ListingPreview = {
  id: string;
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
  onPress?: () => void;
};

export function ListingCard({ listing, connectionDegree, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Imagen 4:3 */}
      <View style={styles.imageContainer}>
        {listing.image_url ? (
          <Image source={{ uri: listing.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>🏠</Text>
          </View>
        )}

        {/* Tipo badge – top left */}
        {listing.type && (
          <View style={[
            styles.typeBadge,
            listing.type === "offer" ? styles.typeBadgeOffer : styles.typeBadgeSearch,
          ]}>
            <Text style={[
              styles.typeBadgeText,
              listing.type === "offer" ? styles.typeBadgeTextOffer : styles.typeBadgeTextSearch,
            ]}>
              {listing.type === "offer" ? "Ofrezco" : "Busco"}
            </Text>
          </View>
        )}

        {/* Friendz badge – bottom left */}
        {connectionDegree != null && (
          <View style={[
            styles.friEndzBadge,
            connectionDegree === 1 ? styles.friEndzBadge1 : styles.friEndzBadge2,
          ]}>
            <Text style={[
              styles.friEndzBadgeText,
              connectionDegree === 1 ? styles.friEndzBadgeText1 : styles.friEndzBadgeText2,
            ]}>
              {connectionDegree === 1 ? "👥 Friendz" : "👥 Amigo de amigo"}
            </Text>
          </View>
        )}

        {/* Like button – top right */}
        <Pressable style={styles.likeBtn} hitSlop={8}>
          <Text style={styles.likeBtnText}>♡</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        {/* Ciudad */}
        <Text style={styles.city}>📍 {listing.city}</Text>

        {/* Título */}
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        {/* Footer: precio */}
        <PriceTag amount={listing.price} size="sm" />
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
  cardPressed: {
    opacity: 0.92,
  },
  imageContainer: {
    aspectRatio: 4 / 3,
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
  imagePlaceholderIcon: {
    fontSize: 40,
  },
  typeBadge: {
    position: "absolute",
    top: spacing[2],
    left: spacing[2],
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  typeBadgeOffer: {
    backgroundColor: colors.primaryLight,
  },
  typeBadgeSearch: {
    backgroundColor: colors.verifyLight,
  },
  typeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  typeBadgeTextOffer: {
    color: colors.primaryDark,
  },
  typeBadgeTextSearch: {
    color: colors.verify,
  },
  friEndzBadge: {
    position: "absolute",
    bottom: spacing[2],
    left: spacing[2],
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  friEndzBadge1: { backgroundColor: colors.primaryLight },
  friEndzBadge2: { backgroundColor: "rgba(255,255,255,0.85)" },
  friEndzBadgeText: { fontSize: fontSize.xs, fontWeight: "700" },
  friEndzBadgeText1: { color: colors.primaryDark },
  friEndzBadgeText2: { color: colors.textSecondary },
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
  body: {
    padding: spacing[3],
    gap: 4,
  },
  city: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 20,
  },
});
