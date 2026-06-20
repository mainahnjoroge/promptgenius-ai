import { StyleSheet, Text, View } from "react-native";
import type { GeneratedPrompt } from "@promptgenius/core";
import { colors, radius, spacing } from "../theme";
import { Card } from "./ui";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function PromptCard({ prompt }: { prompt: GeneratedPrompt }) {
  return (
    <Card>
      <Text style={styles.title}>{prompt.title}</Text>
      <Text style={styles.useCase}>{prompt.useCase}</Text>

      <SectionLabel>Copy-paste prompt</SectionLabel>
      <View style={styles.codeBox}>
        <Text style={styles.code}>{prompt.prompt}</Text>
      </View>

      {prompt.workflow && prompt.workflow.length > 0 && (
        <>
          <SectionLabel>Workflow</SectionLabel>
          {prompt.workflow.map((s) => (
            <View key={s.step} style={styles.step}>
              <Text style={styles.stepTitle}>
                {s.step}. {s.title}
              </Text>
              <Text style={styles.stepBody}>{s.prompt}</Text>
              {!!s.output && <Text style={styles.stepOut}>→ {s.output}</Text>}
            </View>
          ))}
        </>
      )}

      {prompt.variables.length > 0 && (
        <>
          <SectionLabel>Variables</SectionLabel>
          {prompt.variables.map((v) => (
            <Text key={v.name} style={styles.varRow}>
              <Text style={styles.varName}>{v.name}</Text>
              <Text style={styles.varDesc}> — {v.description}</Text>
            </Text>
          ))}
        </>
      )}

      {!!prompt.exampleOutput && (
        <>
          <SectionLabel>Example output</SectionLabel>
          <Text style={styles.example}>{prompt.exampleOutput}</Text>
        </>
      )}

      {prompt.optimizationTips.length > 0 && (
        <>
          <SectionLabel>Optimization tips</SectionLabel>
          {prompt.optimizationTips.map((t, i) => (
            <Text key={i} style={styles.tip}>
              • {t}
            </Text>
          ))}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: "800" },
  useCase: { color: colors.muted, marginTop: spacing(1), fontSize: 13 },
  section: {
    color: colors.brandSoft,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing(4),
    marginBottom: spacing(2),
  },
  codeBox: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing(3),
  },
  code: { color: "#cbd5e1", fontFamily: "monospace", fontSize: 12.5, lineHeight: 19 },
  step: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing(3),
    marginBottom: spacing(2),
  },
  stepTitle: { color: colors.text, fontWeight: "700", fontSize: 13 },
  stepBody: { color: "#cbd5e1", marginTop: spacing(1), fontSize: 13 },
  stepOut: { color: colors.muted, marginTop: spacing(1), fontSize: 12 },
  varRow: { marginBottom: spacing(1.5), fontSize: 13 },
  varName: { color: colors.accent, fontFamily: "monospace" },
  varDesc: { color: "#cbd5e1" },
  example: { color: "#cbd5e1", fontSize: 13, lineHeight: 20 },
  tip: { color: "#cbd5e1", fontSize: 13, marginBottom: spacing(1), lineHeight: 19 },
});
