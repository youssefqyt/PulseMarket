import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../constants/theme";

interface Props {
  quantity: number;
  onChange: (next: number) => void;
  max?: number;
}

export default function QuantityStepper({ quantity, onChange, max = 99 }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.btn}
        onPress={() => onChange(Math.max(1, quantity - 1))}
        hitSlop={6}
      >
        <Ionicons name="remove" size={18} color={colors.text} />
      </Pressable>
      <Text style={styles.value}>{quantity}</Text>
      <Pressable
        style={styles.btn}
        onPress={() => onChange(Math.min(max, quantity + 1))}
        hitSlop={6}
      >
        <Ionicons name="add" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  btn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  value: { minWidth: 28, textAlign: "center", fontWeight: "700", color: colors.text },
});
