import { View, StyleSheet } from "react-native";
import Skeleton from "../ui/Skeleton";

export default function RoomCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.image} />
      <View style={styles.body}>
        <Skeleton height={20} style={styles.skeletonTitle} />
        <Skeleton height={14} style={styles.skeletonSubtitle} />
        <View style={styles.tagsRow}>
          <Skeleton height={24} width={80} rounded />
          <Skeleton height={24} width={80} rounded />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", marginBottom: 12, overflow: "hidden" },
  image: { height: 192, backgroundColor: "#E5E7EB" },
  body: { padding: 16, gap: 8 },
  skeletonTitle: { width: "75%" as any },
  skeletonSubtitle: { width: "50%" as any },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
});
