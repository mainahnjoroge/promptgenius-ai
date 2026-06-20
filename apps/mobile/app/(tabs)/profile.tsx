import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL, getMe, type MeResponse } from "../../src/api";
import { Card } from "../../src/components/ui";
import { colors, spacing } from "../../src/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [reachable, setReachable] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      getMe().then((data) => {
        setMe(data);
        setReachable(!!data);
      });
    }, []),
  );

  const quotaText =
    me?.quota.limit === "unlimited"
      ? "Unlimited"
      : me
        ? `${me.quota.used} / ${me.quota.limit} used`
        : "—";

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing(4),
        paddingTop: insets.top + spacing(3),
        paddingBottom: spacing(10),
        gap: spacing(3),
      }}
    >
      <Text style={styles.h1}>Profile</Text>

      <Card>
        <Row label="Account" value={me?.user.email ?? "Demo (sample mode)"} />
        <Row label="Plan" value={me ? me.tier.name : "—"} />
        <Row label="Quota" value={quotaText} />
        <Row label="Billing" value={me?.user.billingInterval ?? "—"} />
      </Card>

      <Card>
        <Text style={styles.section}>System</Text>
        <Row label="API URL" value={API_URL} />
        <Row
          label="Backend"
          value={reachable == null ? "checking…" : reachable ? "connected" : "offline (mock)"}
        />
        <Row label="Live AI" value={me?.flags.ai ? "enabled" : "sample mode"} />
        <Row label="Auth" value={me?.flags.auth ? "Clerk" : "open / demo"} />
        <Row label="Billing" value={me?.flags.billing ? "Stripe" : "mock"} />
      </Card>

      <Text style={styles.hint}>
        Set EXPO_PUBLIC_API_URL to point at your deployed web API, and
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to enable real auth.
      </Text>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { color: colors.text, fontSize: 26, fontWeight: "800" },
  section: {
    color: colors.brandSoft,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing(2),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing(2),
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { color: colors.muted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: "600", flexShrink: 1, marginLeft: spacing(3) },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
