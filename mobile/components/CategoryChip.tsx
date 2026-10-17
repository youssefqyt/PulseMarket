import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

interface Props {
  label: string;
  active?: boolean;
  onPress: () => void;
}

export default function CategoryChip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.active : styles.inactive]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  active: { backgroundColor: colors.primary },
  inactive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 14, fontWeight: "600" },
  labelActive: { color: colors.white },
  labelInactive: { color: colors.text },
});
