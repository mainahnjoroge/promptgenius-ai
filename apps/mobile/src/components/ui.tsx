import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { colors, radius, spacing } from "../theme";

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
}) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnSecondary,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading && <ActivityIndicator size="small" color={isPrimary ? "#fff" : colors.text} />}
      <Text style={[styles.btnText, !isPrimary && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
    >
      <Text style={[styles.pillText, active && { color: colors.brandSoft }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; locked?: boolean }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable
          key={o.id}
          onPress={() => onChange(o.id)}
          style={[styles.segmentItem, value === o.id && styles.segmentItemActive]}
        >
          <Text style={[styles.segmentText, value === o.id && { color: colors.brandSoft }]}>
            {o.locked ? `🔒 ${o.label}` : o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: spacing(3) }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing(4),
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
  },
  btnPrimary: { backgroundColor: colors.brand },
  btnSecondary: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  pill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  pillActive: { borderColor: colors.brand, backgroundColor: "rgba(139,92,246,0.15)" },
  pillIdle: { borderColor: colors.border },
  pillText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing(2),
    borderRadius: radius.sm,
  },
  segmentItemActive: { backgroundColor: "rgba(139,92,246,0.18)" },
  segmentText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing(1.5),
  },
  input: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    fontSize: 14,
  },
});
