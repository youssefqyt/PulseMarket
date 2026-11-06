import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import StatusPill from "../components/StatusPill";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Button from "../components/Button";
import { colors, radius, shadow, spacing, typography } from "../constants/theme";
import { fetchOrder, fetchOrders } from "../services/order.service";
import { useSettingsStore } from "../store/settingsStore";
import { useCartStore } from "../store/cartStore";
import type { Order, PaymentMethod } from "../types";

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  card: { label: "Credit Card", icon: "card" },
  cash: { label: "Cash on Delivery", icon: "cash" },
};

export default function Orders() {
  const router = useRouter();
  const formatCurrency = useSettingsStore((s) => s.formatCurrency);
  const addToCart = useCartStore((s) => s.add);

  const [orders, setOrders] = useState<Order[]>([]);
  const [details, setDetails] = useState<Record<number, Order>>({});
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchOrders();
      setOrders(result.items);
    } catch (error) {
      Alert.alert("Orders unavailable", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleBuyAgain(order: Order) {
    try {
      for (const item of order.items) {
        if (item.productId) {
          await addToCart(item.productId, item.quantity);
        }
      }
      Alert.alert(
        "Items Added to Cart",
        "The items from this order were added to your cart.",
        [
          { text: "Keep shopping", style: "cancel" },
          { text: "View cart", onPress: () => router.push("/(tabs)/cart") },
        ]
      );
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  }

  async function toggleTracking(orderId: number) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (details[orderId]) return;
    try {
      const order = await fetchOrder(orderId);
      setDetails((current) => ({ ...current, [orderId]: order }));
    } catch (error) {
      setExpandedOrderId(null);
      Alert.alert("Tracking unavailable", (error as Error).message);
    }
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={22} color={colors.text} onPress={() => router.back()} />
          <Text style={styles.title}>My Orders</Text>
          <View style={{ width: 22 }} />
        </View>
      </View>

      {loading && orders.length === 0 ? (
        <Loading />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => {
            const methodInfo = item.paymentMethod
              ? PAYMENT_LABELS[item.paymentMethod]
              : PAYMENT_LABELS.card;
            const tracking = details[item.id];

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{item.id}</Text>
                    <Text style={styles.date}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <StatusPill status={item.status} />
                </View>

                {/* Payment & Delivery Info */}
                <View style={styles.metaInfoRow}>
                  <View style={styles.paymentBadge}>
                    <Ionicons name={methodInfo.icon} size={14} color={colors.primary} />
                    <Text style={styles.paymentBadgeText}>{methodInfo.label}</Text>
                  </View>
                  {item.shippingAddress ? (
                    <Text style={styles.addressSummary} numberOfLines={1}>
                      📍 {item.shippingAddress}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.paymentStateRow}>
                  <Text style={styles.paymentStateLabel}>Payment: {item.paymentStatus || "unpaid"}</Text>
                  {item.phone ? <Text style={styles.paymentStateLabel}>Contact: {item.phone}</Text> : null}
                </View>

                <View style={styles.divider} />

                {item.items.map((line) => (
                  <View key={line.id} style={styles.line}>
                    <Text style={styles.lineLabel} numberOfLines={1}>
                      {line.quantity} × {line.title}
                    </Text>
                    <Text style={styles.lineValue}>
                      {formatCurrency(line.price * line.quantity)}
                    </Text>
                  </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.total}>{formatCurrency(item.total)}</Text>
                  </View>

                  <Button
                    title="Buy again"
                    variant="outline"
                    onPress={() => handleBuyAgain(item)}
                    style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}
                  />
                </View>
                <Pressable onPress={() => void toggleTracking(item.id)} style={styles.trackingToggle}>
                  <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                  <Text style={styles.trackingToggleText}>
                    {expandedOrderId === item.id ? "Hide tracking" : "Track order"}
                  </Text>
                  <Ionicons name={expandedOrderId === item.id ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
                </Pressable>
                {expandedOrderId === item.id ? (
                  <View style={styles.trackingPanel}>
                    {!tracking ? (
                      <Text style={styles.trackingPlaceholder}>Loading tracking details…</Text>
                    ) : (
                      <>
                        <Text style={styles.trackingTitle}>Shipment details</Text>
                        {tracking.fulfillments?.length ? tracking.fulfillments.map((fulfillment) => (
                          <View key={fulfillment.sellerId} style={styles.fulfillmentCard}>
                            <Text style={styles.fulfillmentSeller}>{fulfillment.sellerName}</Text>
                            <Text style={styles.trackingText}>Status: {fulfillment.status}</Text>
                            {fulfillment.carrier ? <Text style={styles.trackingText}>Carrier: {fulfillment.carrier}</Text> : null}
                            {fulfillment.trackingNumber ? <Text style={styles.trackingText}>Tracking: {fulfillment.trackingNumber}</Text> : null}
                            {fulfillment.estimatedDeliveryAt ? (
                              <Text style={styles.trackingText}>
                                Estimated delivery: {new Date(fulfillment.estimatedDeliveryAt).toLocaleDateString()}
                              </Text>
                            ) : null}
                          </View>
                        )) : <Text style={styles.trackingPlaceholder}>Shipment details are not available yet.</Text>}
                        <Text style={styles.trackingTitle}>Order history</Text>
                        {tracking.statusHistory?.length ? tracking.statusHistory.map((event, index) => (
                          <View key={`${event.createdAt}-${index}`} style={styles.historyRow}>
                            <View style={styles.historyDot} />
                            <View style={styles.historyDetails}>
                              <Text style={styles.trackingText}>{event.status.toUpperCase()}</Text>
                              <Text style={styles.trackingPlaceholder}>{event.note || "Status updated"}</Text>
                              <Text style={styles.historyDate}>{new Date(event.createdAt).toLocaleString()}</Text>
                            </View>
                          </View>
                        )) : <Text style={styles.trackingPlaceholder}>No status history is available.</Text>}
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              subtitle="Your placed orders and payment receipts will appear here."
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
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderId: { ...typography.bodyStrong, color: colors.text },
  date: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  metaInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  paymentBadgeText: { fontSize: 11, fontWeight: "600", color: colors.primary, marginLeft: 4 },
  addressSummary: { ...typography.tiny, color: colors.textMuted, flex: 1 },
  paymentStateRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, marginTop: spacing.sm },
  paymentStateLabel: { ...typography.tiny, color: colors.textMuted, textTransform: "capitalize" },
  line: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  lineLabel: { flex: 1, color: colors.textMuted, marginRight: spacing.md },
  lineValue: { color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  totalLabel: { ...typography.tiny, color: colors.textMuted },
  total: { ...typography.h3, color: colors.primary },
  trackingToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  trackingToggleText: { ...typography.small, color: colors.primary, fontWeight: "700", flex: 1, marginLeft: spacing.xs },
  trackingPanel: { padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md },
  trackingTitle: { ...typography.bodyStrong, color: colors.text, marginVertical: spacing.xs },
  fulfillmentCard: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  fulfillmentSeller: { ...typography.small, color: colors.text, fontWeight: "700" },
  trackingText: { ...typography.small, color: colors.text, marginTop: 2 },
  trackingPlaceholder: { ...typography.tiny, color: colors.textMuted },
  historyRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
  historyDetails: { flex: 1 },
  historyDate: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
});
