import { View, Text, StyleSheet } from "react-native";

export default function RequestsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Solicitudes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center" },
  text: { color: "#9CA3AF" },
});
