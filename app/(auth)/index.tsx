import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";

const AVATARS = [
  { letter: "M", color: "#F36A39" },
  { letter: "L", color: "#458CE8" },
  { letter: "A", color: "#45C980" },
  { letter: "R", color: "#9450B8" },
  { letter: "C", color: "#F0AF37" },
];

export default function AuthSplashScreen() {
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* decorative blobs */}
      <View style={[s.blob, { top: -60, left: -80, backgroundColor: "rgba(143,67,42,0.35)" }]} />
      <View style={[s.blob, { bottom: -80, right: -60, backgroundColor: "rgba(29,58,90,0.45)" }]} />

      {/* logo */}
      <View style={s.top}>
        <Text style={s.logo}>
          homi<Text style={s.logoAccent}>match</Text>
        </Text>
        <Text style={s.tagline}>Encuentra habitación entre{"\n"}personas que ya conoces</Text>
      </View>

      {/* social proof */}
      <View style={s.mid}>
        <View style={s.avatarRow}>
          {AVATARS.map((a, i) => (
            <View
              key={a.letter}
              style={[s.avatar, { backgroundColor: a.color, marginLeft: i === 0 ? 0 : -12, zIndex: AVATARS.length - i }]}
            >
              <Text style={s.avatarLetter}>{a.letter}</Text>
            </View>
          ))}
        </View>
        <Text style={s.proof}>
          <Text style={s.proofBold}>+2.400 personas</Text> ya encontraron piso en Madrid
        </Text>
      </View>

      {/* actions */}
      <View style={s.bottom}>
        <Pressable style={s.btnPrimary} onPress={() => router.push("/(auth)/register")}>
          <Text style={s.btnPrimaryText}>Crear cuenta</Text>
        </Pressable>
        <Pressable style={s.btnSecondary} onPress={() => router.push("/(auth)/login")}>
          <Text style={s.btnSecondaryText}>Ya tengo cuenta</Text>
        </Pressable>
        <Text style={s.legal}>
          Al registrarte aceptas los{" "}
          <Text style={s.legalLink}>Términos de uso</Text>
          {" "}y la{" "}
          <Text style={s.legalLink}>Privacidad</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111111" },
  blob: { position: "absolute", width: 320, height: 320, borderRadius: 160 },

  top: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 48, fontWeight: "800", color: "#FFFFFF", letterSpacing: -1 },
  logoAccent: { color: "#F36A39" },
  tagline: { marginTop: 16, fontSize: 17, lineHeight: 26, color: "#8A8480", textAlign: "center" },

  mid: { alignItems: "center", paddingBottom: 40 },
  avatarRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "#111111",
  },
  avatarLetter: { fontSize: 18, fontWeight: "700", color: "#fff" },
  proof: { marginTop: 16, fontSize: 14, color: "#7A7470", textAlign: "center" },
  proofBold: { color: "#FFFFFF", fontWeight: "700" },

  bottom: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  btnPrimary: {
    height: 58, borderRadius: 16, backgroundColor: "#F36A39",
    alignItems: "center", justifyContent: "center",
  },
  btnPrimaryText: { fontSize: 17, fontWeight: "700", color: "#fff" },
  btnSecondary: {
    height: 58, borderRadius: 16, backgroundColor: "#222222",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#333333",
  },
  btnSecondaryText: { fontSize: 17, fontWeight: "600", color: "#CCCCCC" },
  legal: { textAlign: "center", fontSize: 12, color: "#555555", marginTop: 4 },
  legalLink: { color: "#888888", textDecorationLine: "underline" },
});
