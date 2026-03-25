import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, Text, View } from "react-native";

const initials = [
  { letter: "M", color: "#F36A39" },
  { letter: "L", color: "#458CE8" },
  { letter: "A", color: "#45C980" },
  { letter: "R", color: "#9450B8" },
  { letter: "C", color: "#F0AF37" },
];

export default function AuthSplashScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#151515]">
      <StatusBar style="light" />
      <View className="flex-1 px-6 pb-6">
        <View className="flex-1 overflow-hidden rounded-[40px] border border-white/20 bg-[#1C1C1C] px-7 py-6">
          <View className="absolute left-[-70] top-[-30] h-72 w-72 rounded-full bg-[#8F432A]/45" />
          <View className="absolute bottom-[-80] right-[-20] h-72 w-72 rounded-full bg-[#1D3A5A]/55" />

          <View className="flex-row items-center justify-between">
            <Text className="text-[18px] font-semibold text-white">9:41</Text>
            <View className="flex-row items-center gap-1">
              <View className="h-5 w-1 rounded-full bg-white/75" />
              <View className="h-6 w-1 rounded-full bg-white/75" />
              <View className="h-7 w-1 rounded-full bg-white/75" />
              <View className="ml-1 h-7 w-9 rounded-md border border-white/75" />
            </View>
          </View>

          <View className="flex-1 items-center pt-28">
            <Text className="text-[46px] font-extrabold tracking-[-1.5px] text-white">
              homi<Text className="text-[#F36A39]">match</Text>
            </Text>
            <Text className="mt-8 max-w-[290px] text-center text-[18px] leading-8 text-[#AFA6A1]">
              Encuentra habitación entre personas que ya conoces
            </Text>

            <View className="mt-28 flex-row">
              {initials.map((item, index) => (
                <View
                  key={item.letter}
                  className="-mr-2 h-16 w-16 items-center justify-center rounded-full border-2 border-[#1C1C1C]"
                  style={{ backgroundColor: item.color, zIndex: initials.length - index }}
                >
                  <Text className="text-[21px] font-bold text-white">{item.letter}</Text>
                </View>
              ))}
            </View>

            <Text className="mt-8 text-center text-[16px] text-[#A9A9A9]">
              <Text className="font-bold text-white">+2.400 personas</Text> ya encontraron piso en Madrid
            </Text>
          </View>

          <View className="gap-5">
            <Pressable
              onPress={() => router.push("/(auth)/register")}
              className="h-20 items-center justify-center rounded-[18px] border border-white/25 bg-white/5"
            >
              <Text className="text-[19px] font-bold text-white">Crear cuenta</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(auth)/login")}
              className="h-20 items-center justify-center rounded-[18px] border border-white/25 bg-white/5"
            >
              <Text className="text-[19px] font-bold text-white">Ya tengo cuenta</Text>
            </Pressable>
          </View>

          <Text className="pt-10 text-center text-[14px] leading-6 text-[#6F6F6F]">
            Al registrarte aceptas los{" "}
            <Text className="text-[#A5A5A5] underline">Términos de uso</Text> y la{" "}
            <Text className="text-[#A5A5A5] underline">Privacidad</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
