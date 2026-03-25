import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { RoomListing } from "../../types";
import { formatPrice } from "../../utils/format";

interface RoomCardProps {
  listing: RoomListing;
  onPress?: () => void;
  compact?: boolean;
}

export default function RoomCard({ listing, onPress, compact }: RoomCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.image} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        </View>
        {listing.address_approx && (
          <Text style={styles.address}>{listing.address_approx}</Text>
        )}
        {!compact && (
          <View style={styles.tagsRow}>
            {listing.allows_pets && (
              <View style={[styles.tag, styles.tagGreen]}>
                <Text style={[styles.tagText, styles.tagTextGreen]}>🐾 Mascotas</Text>
              </View>
            )}
            {listing.has_private_bath && (
              <View style={[styles.tag, styles.tagBlue]}>
                <Text style={[styles.tagText, styles.tagTextBlue]}>🚿 Baño privado</Text>
              </View>
            )}
            {listing.is_furnished && (
              <View style={[styles.tag, styles.tagAmber]}>
                <Text style={[styles.tagText, styles.tagTextAmber]}>🛋️ Amueblada</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  image: { height: 192, backgroundColor: "#F3F4F6" },
  body: { padding: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 18, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  price: { fontSize: 18, fontWeight: "700", color: "#4F46E5" },
  address: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  tag: { borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 12 },
  tagGreen: { backgroundColor: "#F0FDF4" },
  tagTextGreen: { color: "#15803D" },
  tagBlue: { backgroundColor: "#EFF6FF" },
  tagTextBlue: { color: "#1D4ED8" },
  tagAmber: { backgroundColor: "#FFFBEB" },
  tagTextAmber: { color: "#B45309" },
});
