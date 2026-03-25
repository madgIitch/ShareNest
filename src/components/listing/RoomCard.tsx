import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { RoomListing } from "../../types";

interface RoomCardProps {
  listing: RoomListing;
  onPress?: () => void;
  onSave?: () => void;
  compact?: boolean;
  saved?: boolean;
}

export default function RoomCard({ listing, onPress, onSave, compact, saved }: RoomCardProps) {
  if (compact) {
    return (
      <TouchableOpacity style={s.compactCard} onPress={onPress} activeOpacity={0.85}>
        <View style={s.compactImage} />
        <View style={s.compactBody}>
          <Text style={s.compactTitle} numberOfLines={1}>{listing.title}</Text>
          {listing.address_approx && (
            <Text style={s.compactAddress} numberOfLines={1}>{listing.address_approx}</Text>
          )}
          <Text style={s.compactPrice}>€{listing.price}<Text style={s.compactMes}>/mes</Text></Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#444" />
      </TouchableOpacity>
    );
  }

  const bedLabel =
    listing.bed_type === "doble" ? "Hab. doble"
    : listing.bed_type === "litera" ? "Litera"
    : listing.bed_type === "individual" ? "Hab. individual"
    : null;

  const isNew = (() => {
    if (!listing.created_at) return false;
    const diff = Date.now() - new Date(listing.created_at).getTime();
    return diff < 1000 * 60 * 60 * 24 * 3; // 3 days
  })();

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      {/* Image area */}
      <View style={s.imageWrap}>
        <View style={s.image} />

        {/* Top-left badges */}
        <View style={s.badges}>
          {isNew && (
            <View style={[s.badge, s.badgeOrange]}>
              <Text style={s.badgeTextOrange}>Nuevo</Text>
            </View>
          )}
          {listing.has_private_bath && (
            <View style={s.badge}>
              <Text style={s.badgeText}>Baño privado</Text>
            </View>
          )}
          {bedLabel && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{bedLabel}</Text>
            </View>
          )}
        </View>

        {/* Save button */}
        <Pressable style={s.saveBtn} onPress={onSave} hitSlop={8}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={18}
            color={saved ? "#F36A39" : "#fff"}
          />
        </Pressable>
      </View>

      {/* Body */}
      <View style={s.body}>
        {/* Price */}
        <View style={s.priceRow}>
          <Text style={s.price}>€{listing.price}</Text>
          <Text style={s.mes}>/mes</Text>
          {listing.size_m2 && (
            <Text style={s.size}> · {listing.size_m2} m²</Text>
          )}
        </View>

        {/* Title */}
        <Text style={s.title} numberOfLines={1}>{listing.title}</Text>

        {/* Location */}
        {listing.address_approx && (
          <View style={s.locationRow}>
            <Ionicons name="location-outline" size={13} color="#666" />
            <Text style={s.location} numberOfLines={1}>{listing.address_approx}</Text>
          </View>
        )}

        {/* Tags */}
        <View style={s.tagsRow}>
          {listing.allows_pets && <Tag label="🐾 Mascotas" />}
          {listing.is_furnished && <Tag label="🛋️ Amueblada" />}
          {listing.has_quiet_hours && <Tag label="🔇 Silencio" />}
          {!listing.allows_smoking && <Tag label="🚭 No fumadores" />}
          {listing.owner_lives_here && <Tag label="👤 Con propietario" />}
        </View>

        {/* Footer: availability */}
        {listing.available_from && (
          <Text style={s.available}>
            Disponible desde {new Date(listing.available_from).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={s.tag}>
      <Text style={s.tagText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#222",
  },
  imageWrap: {
    height: 200,
    position: "relative",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#2A2A2A",
  },
  badges: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  badgeOrange: {
    backgroundColor: "#F36A39",
    borderColor: "#F36A39",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  badgeTextOrange: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  saveBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  body: {
    padding: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  mes: {
    fontSize: 14,
    fontWeight: "400",
    color: "#888",
    marginLeft: 2,
  },
  size: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ccc",
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 12,
  },
  location: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "#222",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  tagText: {
    fontSize: 12,
    color: "#aaa",
  },
  available: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  // Compact styles
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    overflow: "hidden",
    gap: 12,
    padding: 12,
  },
  compactImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#2A2A2A",
  },
  compactBody: {
    flex: 1,
    gap: 3,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  compactAddress: {
    fontSize: 12,
    color: "#666",
  },
  compactPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F36A39",
    marginTop: 2,
  },
  compactMes: {
    fontSize: 12,
    fontWeight: "400",
    color: "#888",
  },
});
