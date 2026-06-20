import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../src/theme";

function icon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.brandSoft,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Generate", tabBarIcon: icon("✨") }} />
      <Tabs.Screen name="library" options={{ title: "Library", tabBarIcon: icon("📚") }} />
      <Tabs.Screen name="pricing" options={{ title: "Pricing", tabBarIcon: icon("💎") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("👤") }} />
    </Tabs>
  );
}
