import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";

import { supabase } from "../../src/lib/supabase";

export default function AuthCallbackScreen() {
  useEffect(() => {
    const handleUrl = async (url: string) => {
      const fragment = url.split("#")[1];
      if (!fragment) {
        router.replace("/");
        return;
      }

      const params = new URLSearchParams(fragment);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }

      router.replace("/");
    };

    // App opened from cold start via deep link
    Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
      else router.replace("/");
    });

    // App was already running and received the deep link
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#1f63f1" />
    </View>
  );
}
