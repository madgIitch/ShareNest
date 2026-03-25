import { Image, View, Text } from "react-native";

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
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      className="bg-indigo-100 items-center justify-center"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text className="text-indigo-600 font-semibold" style={{ fontSize: size * 0.4 }}>
        {initials ?? "?"}
      </Text>
    </View>
  );
}
