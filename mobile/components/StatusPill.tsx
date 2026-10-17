import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../constants/theme";
import type { OrderStatus } from "../types";

const MAP: Record<OrderStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FFF4D6", fg: "#B77E00", label: "Pending" },
  paid: { bg: "#E1F7F0", fg: "#00815F", label: "Paid" },
  shipped: { bg: "#E5ECFF", fg: "#3355CC", label: "Shipped" },
  completed: { bg: "#E1F7F0", fg: "#00815F", label: "Completed" },
  cancelled: { bg: "#FFE5E5", fg: "#C0392B", label: "Cancelled" },
};

export default function StatusPill({ status }: { status: OrderStatus }) {
  const s = MAP[status] ?? MAP.pending;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  text: { fontSize: 12, fontWeight: "700" },
});
