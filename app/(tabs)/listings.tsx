import { StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { EmptyState } from "../../src/components/ui/EmptyState";
import { colors } from "../../src/theme";

export default function ListingsScreen() {
  // Sprint 4 implementará la gestión de anuncios propios
  return (
    <View style={styles.screen}>
      <EmptyState
        icon="📋"
        title="No tienes anuncios"
        subtitle="Publica tu primer anuncio y encuentra compañero de piso."
        action={{
          label: "Publicar anuncio",
          onPress: () => router.push("/listing/new"),
        }}
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
