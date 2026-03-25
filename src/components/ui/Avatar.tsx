import { Image, View, Text, StyleSheet } from "react-native";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

export default function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (uri) {
    return (
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials ?? "?"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: "#E0E7FF", alignItems: "center", justifyContent: "center" },
  initials: { color: "#4F46E5", fontWeight: "600" },
});
