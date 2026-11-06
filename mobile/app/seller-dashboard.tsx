import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import StatusPill from "../components/StatusPill";
import { colors, radius, shadow, spacing, typography } from "../constants/theme";
import { fetchSellerAnalytics, fetchSellerOrders, updateSellerFulfillment, type SellerAnalytics } from "../services/seller.service";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import type { Order } from "../types";

type DashboardTab = "overview" | "orders";

export default function SellerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const formatCurrency = useSettingsStore((state) => state.formatCurrency);
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metrics, result] = await Promise.all([fetchSellerAnalytics(), fetchSellerOrders()]);
      setAnalytics(metrics);
      setOrders(result.items);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (role === "seller" || role === "admin") void load();
  }, [load, role]));

  async function saveShipment() {
    if (!selectedOrder) return;
    if (trackingNumber.trim().length < 3 || carrier.trim().length < 2) {
      Alert.alert("Tracking details required", "Enter a carrier and valid tracking number.");
      return;
    }
    if (estimatedDate && Number.isNaN(Date.parse(estimatedDate))) {
      Alert.alert("Invalid delivery date", "Use a date such as 2026-12-24.");
      return;
    }
    setUpdating(selectedOrder.id);
    try {
      const updated = await updateSellerFulfillment(selectedOrder.id, {
        trackingNumber: trackingNumber.trim(),
        carrier: carrier.trim(),
        estimatedDeliveryAt: estimatedDate ? new Date(estimatedDate).toISOString() : undefined,
      });
      setOrders((current) => current.map((item) => item.id === updated.id
        ? { ...item, sellerFulfillment: updated.sellerFulfillment }
        : item));
      setSelectedOrder(null);
    } catch (updateError) {
      Alert.alert("Unable to save tracking details", (updateError as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  async function changeShipmentStatus(order: Order, status: "shipped" | "completed") {
    const fulfillment = order.sellerFulfillment;
    if (!fulfillment) return;
    if (status === "shipped" && (!fulfillment.tracking_number || !fulfillment.carrier)) {
      Alert.alert("Add tracking first", "Save the carrier and tracking number before marking this shipment as shipped.");
      return;
    }
    setUpdating(order.id);
    try {
      const updated = await updateSellerFulfillment(order.id, { status });
      setOrders((current) => current.map((item) => item.id === updated.id
        ? { ...item, status: updated.status, sellerFulfillment: updated.sellerFulfillment }
        : item));
      await load();
    } catch (updateError) {
      Alert.alert("Unable to update fulfillment", (updateError as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  if (role !== "seller" && role !== "admin") {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title="Seller access required"
          subtitle="Seller operations are available to approved seller accounts."
          action={<Button title="Go back" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  if (role === "seller" && user?.sellerStatus !== "approved") {
    return (
      <Screen>
        <EmptyState
          icon="time-outline"
          title={user?.sellerStatus === "rejected" ? "Seller application not approved" : "Seller approval pending"}
          subtitle="An administrator must approve your seller account before you can manage listings or orders."
          action={<Button title="Go back" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Seller workspace</Text>
          <Text style={styles.subtitle}>Sales, stock and fulfillment</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => void load()} accessibilityLabel="Refresh seller workspace">
          <Ionicons name="refresh" size={19} color={colors.primary} />
        </Pressable>
      </View>
      <View style={styles.tabs}>
        {(["overview", "orders"] as const).map((value) => (
          <Pressable key={value} onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.tabActive]}>
            <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>
              {value === "overview" ? "Overview" : `Orders${orders.length ? ` (${orders.length})` : ""}`}
            </Text>
          </Pressable>
        ))}
        <Pressable style={styles.manageLink} onPress={() => router.push("/my-products")}>
          <Ionicons name="cube-outline" size={15} color={colors.primary} />
          <Text style={styles.manageText}>Listings</Text>
        </Pressable>
      </View>

      {loading && !analytics ? <Loading /> : error && !analytics ? (
        <EmptyState icon="cloud-offline-outline" title="Seller data unavailable" subtitle={error}
          action={<Button title="Retry" onPress={load} />} />
      ) : tab === "overview" ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          keyExtractor={() => "overview"}
          contentContainerStyle={styles.content}
          refreshing={loading}
          onRefresh={load}
          ListHeaderComponent={
            <View>
              <View style={styles.metricGrid}>
                <Metric label="Sales orders" value={analytics?.orders ?? 0} icon="receipt-outline" />
                <Metric label="Paid revenue" value={formatCurrency(analytics?.revenue ?? 0)} icon="cash-outline" />
                <Metric label="Open order lines" value={analytics?.openLines ?? 0} icon="time-outline" />
                <Metric label="Low stock listings" value={analytics?.lowStockProducts ?? 0} icon="warning-outline" />
              </View>
              <Text style={styles.sectionTitle}>Best sellers</Text>
              {(analytics?.bestSellers ?? []).map((product) => (
                <View key={product.id} style={styles.bestSeller}>
                  <View style={styles.bestIcon}><Ionicons name="pricetag-outline" size={17} color={colors.primary} /></View>
                  <View style={styles.bestText}>
                    <Text style={styles.productTitle} numberOfLines={1}>{product.title}</Text>
                    <Text style={styles.meta}>{product.unitsSold} sold · {product.stock} in stock</Text>
                  </View>
                  <Text style={styles.revenue}>{formatCurrency(product.revenue)}</Text>
                </View>
              ))}
              <Text style={styles.note}>Revenue counts paid orders. Low stock uses each listing’s configured threshold.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => {
            const shipment = item.sellerFulfillment;
            const buyerLine = [item.buyerName, item.buyerEmail, item.phone].filter(Boolean).join(" · ");
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHead}>
                  <View>
                    <Text style={styles.productTitle}>Order #{item.id}</Text>
                    <Text style={styles.meta}>{buyerLine || "Buyer contact unavailable"}</Text>
                  </View>
                  <StatusPill status={item.status} />
                </View>
                <Text style={styles.address} numberOfLines={2}>Deliver to: {item.shippingAddress || "No address"}</Text>
                {item.items.map((line) => (
                  <Text key={line.id} style={styles.line}>{line.quantity} × {line.title} · {formatCurrency(line.price * line.quantity)}</Text>
                ))}
                <View style={styles.shipmentBox}>
                  <Text style={styles.shipmentTitle}>Your shipment · {shipment?.status || "pending"}</Text>
                  {shipment?.carrier || shipment?.tracking_number ? (
                    <Text style={styles.meta}>{shipment.carrier || "Carrier"} · {shipment.tracking_number || "Tracking pending"}</Text>
                  ) : <Text style={styles.meta}>Tracking has not been added.</Text>}
                  {shipment?.estimated_delivery_at ? (
                    <Text style={styles.meta}>Estimated delivery: {new Date(shipment.estimated_delivery_at).toLocaleDateString()}</Text>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={styles.outlineButton}
                    onPress={() => {
                      setSelectedOrder(item);
                      setTrackingNumber(shipment?.tracking_number || "");
                      setCarrier(shipment?.carrier || "");
                      setEstimatedDate(shipment?.estimated_delivery_at?.slice(0, 10) || "");
                    }}
                  >
                    <Text style={styles.outlineText}>Tracking details</Text>
                  </Pressable>
                  {shipment?.status === "pending" ? (
                    <Pressable disabled={updating === item.id} style={styles.primaryButton}
                      onPress={() => void changeShipmentStatus(item, "shipped")}>
                      <Text style={styles.primaryText}>{updating === item.id ? "Updating…" : "Mark shipped"}</Text>
                    </Pressable>
                  ) : shipment?.status === "shipped" ? (
                    <Pressable disabled={updating === item.id} style={styles.primaryButton}
                      onPress={() => void changeShipmentStatus(item, "completed")}>
                      <Text style={styles.primaryText}>{updating === item.id ? "Updating…" : "Complete delivery"}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title="No seller orders yet"
              subtitle="Orders containing your products appear here once a customer checks out." />
          }
        />
      )}

      <Modal visible={Boolean(selectedOrder)} transparent animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.sectionTitle}>Shipment details</Text>
            <TextInput value={carrier} onChangeText={setCarrier} placeholder="Carrier name" style={styles.input} />
            <TextInput value={trackingNumber} onChangeText={setTrackingNumber} placeholder="Tracking number" style={styles.input} />
            <TextInput value={estimatedDate} onChangeText={setEstimatedDate} placeholder="Estimated delivery (YYYY-MM-DD)" style={styles.input} />
            <View style={styles.actions}>
              <Pressable style={styles.outlineButton} onPress={() => setSelectedOrder(null)}>
                <Text style={styles.outlineText}>Cancel</Text>
              </Pressable>
              <Pressable disabled={updating !== null} style={styles.primaryButton} onPress={() => void saveShipment()}>
                <Text style={styles.primaryText}>Save tracking</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={19} color={colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  iconButton: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, marginLeft: spacing.md },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted },
  tabs: { flexDirection: "row", alignItems: "center", marginHorizontal: spacing.lg, marginBottom: spacing.sm, padding: 3, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  tab: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface, ...shadow.soft },
  tabText: { ...typography.small, color: colors.textMuted, fontWeight: "700" },
  tabTextActive: { color: colors.primary },
  manageLink: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: spacing.xs },
  manageText: { ...typography.tiny, color: colors.primary, fontWeight: "700" },
  content: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl, flexGrow: 1 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.sm },
  metric: { width: "48%", minHeight: 112, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, ...shadow.soft },
  metricValue: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  meta: { ...typography.tiny, color: colors.textMuted, marginTop: 3 },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  bestSeller: { flexDirection: "row", alignItems: "center", padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.sm },
  bestIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  bestText: { flex: 1, marginHorizontal: spacing.sm },
  productTitle: { ...typography.bodyStrong, color: colors.text },
  revenue: { ...typography.small, color: colors.primary, fontWeight: "700" },
  note: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 18 },
  orderCard: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.md, ...shadow.soft },
  orderHead: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  address: { ...typography.small, color: colors.text, marginTop: spacing.sm },
  line: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.xs },
  shipmentBox: { marginTop: spacing.md, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  shipmentTitle: { ...typography.small, color: colors.text, fontWeight: "700", textTransform: "capitalize" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  primaryButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md },
  primaryText: { ...typography.tiny, color: colors.white, fontWeight: "700" },
  outlineButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  outlineText: { ...typography.tiny, color: colors.primary, fontWeight: "700" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  modal: { padding: spacing.lg, paddingBottom: spacing.xxl, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.surface },
  input: { height: 46, paddingHorizontal: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text },
});
