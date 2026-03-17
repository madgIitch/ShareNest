import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../../theme";
import { PriceTag } from "./PriceTag";
import { TagBadge } from "./TagBadge";
import { UserAvatar } from "./UserAvatar";

// Tipo provisional hasta Sprint 4 (listings DB)
export type ListingPreview = {
  id: string;
  title: string;
  price: number;
  city: string;
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
  onPress?: () => void;
};

export function ListingCard({ listing, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Imagen */}
      <View style={styles.imageContainer}>
        {listing.image_url ? (
          <Image source={{ uri: listing.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>🏠</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Ciudad */}
        <Text style={styles.city}>📍 {listing.city}</Text>

        {/* Título */}
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <View style={styles.tags}>
            {listing.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag} label={tag} />
            ))}
          </View>
        )}

        {/* Footer: precio + avatar */}
        <View style={styles.footer}>
          <PriceTag amount={listing.price} size="sm" />
          {listing.owner && (
            <UserAvatar
              avatarUrl={listing.owner.avatar_url}
              name={listing.owner.full_name}
              size="xs"
              verified={!!listing.owner.verified_at}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    height: 160,
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
  body: {
    padding: spacing[3],
    gap: spacing[2],
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
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing[1],
  },
});
