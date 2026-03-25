import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { pickAvatar } from "../../lib/avatar";
import { colors, fontSize, radius, spacing } from "../../theme";

type Props = {
  uri: string | null;
  onPick: (uri: string) => void;
  label?: string;
  size?: number;
};

export function ImagePickerInput({ uri, onPick, label = "Añadir foto", size = 88 }: Props) {
  const handlePress = async () => {
    const asset = await pickAvatar();
    if (asset) onPick(asset.uri);
  };

  return (
    <Pressable onPress={handlePress} style={styles.wrapper}>
      <View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.icon}>📷</Text>
          </View>
        )}
      </View>
      <Text style={styles.label}>{uri ? "Cambiar foto" : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: spacing[2],
  },
  container: {
    overflow: "hidden",
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.full,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
});
