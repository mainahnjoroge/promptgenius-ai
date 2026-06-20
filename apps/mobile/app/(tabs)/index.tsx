import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  GeneratedPrompt,
  GenerationInput,
  OutputType,
  Platform,
  SkillLevel,
} from "@promptgenius/core";
import { generate, getMe, savePrompt } from "../../src/api";
import { AppButton, Card, Field, Label, Segmented } from "../../src/components/ui";
import { PromptCard } from "../../src/components/PromptCard";
import { colors, spacing } from "../../src/theme";

const PLATFORMS: Platform[] = ["claude", "chatgpt", "gemini", "midjourney", "generic"];

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<GenerationInput>({
    industry: "Marketing",
    useCase: "",
    skillLevel: "intermediate",
    outputType: "simple",
    tone: "",
    platform: "claude",
  });
  const [allowed, setAllowed] = useState<OutputType[]>(["simple", "advanced", "workflow"]);
  const [result, setResult] = useState<GeneratedPrompt | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMe().then((me) => {
      if (me) setAllowed(me.tier.allowedOutputTypes as OutputType[]);
    });
  }, []);

  const set = <K extends keyof GenerationInput>(k: K, v: GenerationInput[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));

  async function onGenerate() {
    if (!filters.useCase.trim()) return;
    setLoading(true);
    setNote(null);
    setSaved(false);
    try {
      const res = await generate(filters);
      setResult(res.prompt);
      if (res.gate) setNote(res.gate.message ?? "This feature requires an upgrade.");
      else if (res.source === "mock") setNote("Showing a sample (offline or sample mode).");
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!result) return;
    const ok = await savePrompt(result);
    setSaved(ok);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing(4),
        paddingTop: insets.top + spacing(3),
        paddingBottom: spacing(10),
        gap: spacing(4),
      }}
    >
      <View>
        <Text style={styles.h1}>PromptGenius</Text>
        <Text style={styles.sub}>Generate structured, monetizable prompts.</Text>
      </View>

      <Card>
        <Field
          label="Industry"
          value={filters.industry}
          onChangeText={(t) => set("industry", t)}
          placeholder="e.g. Marketing"
        />
        <Field
          label="Use case"
          value={filters.useCase}
          onChangeText={(t) => set("useCase", t)}
          placeholder="e.g. write a launch email"
          multiline
        />

        <Label>Skill level</Label>
        <View style={{ marginBottom: spacing(3) }}>
          <Segmented<SkillLevel>
            value={filters.skillLevel}
            onChange={(v) => set("skillLevel", v)}
            options={[
              { id: "beginner", label: "Beginner" },
              { id: "intermediate", label: "Intermediate" },
              { id: "advanced", label: "Advanced" },
            ]}
          />
        </View>

        <Label>Output complexity</Label>
        <View style={{ marginBottom: spacing(3) }}>
          <Segmented<OutputType>
            value={filters.outputType}
            onChange={(v) => set("outputType", v)}
            options={[
              { id: "simple", label: "Simple" },
              { id: "advanced", label: "Advanced", locked: !allowed.includes("advanced") },
              { id: "workflow", label: "Workflow", locked: !allowed.includes("workflow") },
            ]}
          />
        </View>

        <Field
          label="Tone (optional)"
          value={filters.tone}
          onChangeText={(t) => set("tone", t)}
          placeholder="e.g. punchy and confident"
        />

        <Label>Platform</Label>
        <View style={styles.platformRow}>
          {PLATFORMS.map((p) => (
            <View key={p} style={{ marginRight: spacing(2), marginBottom: spacing(2) }}>
              <PlatformPill
                label={p}
                active={filters.platform === p}
                onPress={() => set("platform", p)}
              />
            </View>
          ))}
        </View>

        <AppButton
          label={loading ? "Generating…" : "Generate prompt"}
          onPress={onGenerate}
          loading={loading}
          disabled={!filters.useCase.trim()}
        />
      </Card>

      {note && (
        <View style={styles.note}>
          <Text style={styles.noteText}>{note}</Text>
        </View>
      )}

      {result && (
        <View style={{ gap: spacing(3) }}>
          <PromptCard prompt={result} />
          <AppButton
            label={saved ? "Saved ✓" : "Save to library"}
            variant="secondary"
            onPress={onSave}
            disabled={saved}
          />
        </View>
      )}
    </ScrollView>
  );
}

function PlatformPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.pPill, active ? styles.pPillActive : styles.pPillIdle]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: { color: colors.text, fontSize: 26, fontWeight: "800" },
  sub: { color: colors.muted, marginTop: spacing(1) },
  platformRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: spacing(4) },
  pPill: {
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  pPillActive: {
    borderColor: colors.brand,
    backgroundColor: "rgba(139,92,246,0.15)",
    color: colors.brandSoft,
  },
  pPillIdle: { borderColor: colors.border, color: colors.muted },
  note: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    padding: spacing(3),
  },
  noteText: { color: colors.brandSoft, fontSize: 13 },
});
