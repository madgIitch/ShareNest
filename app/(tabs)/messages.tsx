import { StyleSheet, View } from "react-native";

import { EmptyState } from "../../src/components/ui/EmptyState";
import { colors } from "../../src/theme";

export default function MessagesScreen() {
  // Sprint 5 implementará mensajería real
  return (
    <View style={styles.screen}>
      <EmptyState
        icon="💬"
        title="Sin mensajes"
        subtitle="Cuando contactes con alguien sobre un anuncio, verás aquí la conversación."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
