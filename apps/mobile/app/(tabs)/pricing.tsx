import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  TIERS,
  TIER_ORDER,
  annualTotal,
  priceFor,
  type BillingInterval,
  type TierId,
} from "@promptgenius/core";
import { checkout, getMe } from "../../src/api";
import { AppButton, Card, Pill } from "../../src/components/ui";
import { colors, spacing } from "../../src/theme";

export default function PricingScreen() {
  const insets = useSafeAreaInsets();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [current, setCurrent] = useState<TierId | undefined>();
  const [busy, setBusy] = useState<TierId | null>(null);

  const refresh = useCallback(async () => {
    const me = await getMe();
    if (me) setCurrent(me.user.tier);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function upgrade(tier: TierId) {
    setBusy(tier);
    await checkout(tier, interval);
    await refresh();
    setBusy(null);
  }

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
      <Text style={styles.h1}>Pricing</Text>
      <Text style={styles.sub}>Upgrade to unlock advanced prompts, bundles & workflows.</Text>

      <View style={styles.toggle}>
        <Pill label="Monthly" active={interval === "monthly"} onPress={() => setInterval("monthly")} />
        <Pill label="Annual −25%" active={interval === "annual"} onPress={() => setInterval("annual")} />
      </View>

      {TIER_ORDER.map((id) => {
        const tier = TIERS[id];
        const price = priceFor(id, interval);
        const isCurrent = current === id;
        return (
          <Card key={id} style={tier.highlight ? styles.highlight : undefined}>
            <View style={styles.row}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.price}>
                {price === 0 ? "Free" : `$${price}`}
                {price > 0 ? <Text style={styles.per}>/mo</Text> : null}
              </Text>
            </View>
            <Text style={styles.tagline}>{tier.tagline}</Text>
            {price > 0 && interval === "annual" && (
              <Text style={styles.annual}>${annualTotal(id)} billed yearly</Text>
            )}

            <View style={{ marginTop: spacing(3), gap: spacing(1.5) }}>
              {tier.features
                .filter((f) => f.included)
                .slice(0, 5)
                .map((f) => (
                  <Text key={f.label} style={styles.feature}>
                    ✓ {f.label}
                  </Text>
                ))}
            </View>

            <View style={{ marginTop: spacing(3) }}>
              {id === "starter" ? (
                <AppButton
                  label={isCurrent ? "Current plan" : "Free"}
                  variant="secondary"
                  onPress={() => {}}
                  disabled
                />
              ) : (
                <AppButton
                  label={isCurrent ? "Current plan" : `Upgrade to ${tier.name}`}
                  onPress={() => upgrade(id)}
                  loading={busy === id}
                  disabled={isCurrent}
                />
              )}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h1: { color: colors.text, fontSize: 26, fontWeight: "800" },
  sub: { color: colors.muted, marginTop: -spacing(1) },
  toggle: { flexDirection: "row", gap: spacing(2), justifyContent: "center", marginVertical: spacing(2) },
  highlight: { borderColor: colors.brand },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tierName: { color: colors.text, fontSize: 18, fontWeight: "800" },
  price: { color: colors.text, fontSize: 22, fontWeight: "800" },
  per: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  tagline: { color: colors.muted, marginTop: spacing(1), fontSize: 13 },
  annual: { color: colors.accent, marginTop: spacing(1), fontSize: 12 },
  feature: { color: "#cbd5e1", fontSize: 13 },
});
