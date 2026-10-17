import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Button from "../components/Button";
import { colors, formatPrice, radius, shadow, spacing, typography } from "../constants/theme";
import { fetchOrders } from "../services/order.service";
import type { Order } from "../types";

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchOrders();
      setOrders(result.items);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={22} color={colors.text} onPress={() => router.back()} />
          <Text style={styles.title}>My Orders</Text>
          <View style={{ width: 22 }} />
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <StatusPill status={item.status} />
              </View>

              {item.items.map((line) => (
                <View key={line.id} style={styles.line}>
                  <Text style={styles.lineLabel} numberOfLines={1}>
                    {line.quantity} × {line.title}
                  </Text>
                  <Text style={styles.lineValue}>
                    {formatPrice(line.price * line.quantity)}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />
              <View style={styles.cardHeader}>
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.total}>{formatPrice(item.total)}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              subtitle="Your placed orders will appear here."
              action={<Button title="Start shopping" onPress={() => router.replace("/(tabs)")} />}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...typography.h2, color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderId: { ...typography.bodyStrong, color: colors.text },
  line: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  lineLabel: { flex: 1, color: colors.textMuted, marginRight: spacing.md },
  lineValue: { color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  date: { ...typography.small, color: colors.textMuted },
  total: { ...typography.h3, color: colors.primary },
});
