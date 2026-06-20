import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listPrompts, type SavedPromptDTO } from "../../src/api";
import { Card } from "../../src/components/ui";
import { colors, spacing } from "../../src/theme";

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [prompts, setPrompts] = useState<SavedPromptDTO[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setPrompts(await listPrompts());
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing(4),
        paddingTop: insets.top + spacing(3),
        paddingBottom: spacing(10),
        gap: spacing(3),
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.brandSoft} />
      }
    >
      <Text style={styles.h1}>Library</Text>
      <Text style={styles.sub}>Your saved prompts. Pull to refresh.</Text>

      {prompts.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            No saved prompts yet. Generate one and tap “Save to library”.
          </Text>
        </Card>
      ) : (
        prompts.map((p) => (
          <Card key={p.id}>
            <View style={styles.row}>
              <Text style={styles.title}>{p.title}</Text>
              {p.favorite && <Text style={styles.star}>★</Text>}
            </View>
            <Text style={styles.meta}>
              {p.industry} · {p.outputType}
            </Text>
            <Text numberOfLines={2} style={styles.preview}>
              {p.prompt}
            </Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { color: colors.text, fontSize: 26, fontWeight: "800" },
  sub: { color: colors.muted, marginTop: -spacing(1) },
  empty: { color: colors.muted, fontSize: 14, textAlign: "center", paddingVertical: spacing(4) },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 },
  star: { color: colors.brand, fontSize: 16 },
  meta: { color: colors.muted, fontSize: 12, marginTop: spacing(1) },
  preview: { color: "#cbd5e1", fontSize: 13, marginTop: spacing(2) },
});
