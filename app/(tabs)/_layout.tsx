import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorar",
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: "Mis anuncios",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Mensajes",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="friendz"
        options={{
          title: "Friendz",
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="household"
        options={{
          title: "Piso",
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="property/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="property/[id]/edit"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
