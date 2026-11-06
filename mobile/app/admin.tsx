import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import StatusPill from "../components/StatusPill";
import { colors, radius, shadow, spacing, typography } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import {
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminSummary,
  fetchAdminAudit,
  fetchAdminTrends,
  fetchAdminUsers,
  setProductVisibility,
  updateAdminUser,
  type AdminUser,
  type AdminSummary,
} from "../services/admin.service";
import type { Order, Product } from "../types";

type AdminTab = "overview" | "products" | "orders" | "users" | "audit";

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const formatCurrency = useSettingsStore((state) => state.formatCurrency);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [audit, setAudit] = useState<{
    id: number; action: string; targetType: string; targetId: string;
    details: Record<string, unknown>; createdAt: string; adminName?: string;
  }[]>([]);
  const [trends, setTrends] = useState<{
    day: string; orders: number; cancellations: number; revenue: number; activeSellers: number;
  }[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSummary, productPage, orderPage, auditRows, salesTrends] = await Promise.all([
        fetchAdminSummary(),
        fetchAdminProducts(),
        fetchAdminOrders(),
        fetchAdminAudit(),
        fetchAdminTrends(),
      ]);
      setSummary(nextSummary);
      setProducts(productPage.items);
      setOrders(orderPage.items);
      setAudit(auditRows);
      setTrends(salesTrends);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role !== "admin") return;
      fetchAdminUsers(userSearch).then((page) => setUsers(page.items)).catch((loadError: Error) => {
        setError(loadError.message);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [user?.role, userSearch]);

  useFocusEffect(
    useCallback(() => {
      if (user?.role === "admin") void load();
    }, [load, user?.role])
  );

  async function toggleProduct(product: Product) {
    setUpdating(product.id);
    try {
      const updated = await setProductVisibility(product.id, !product.isActive);
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSummary((current) => current ? {
        ...current,
        activeProducts: current.activeProducts + (updated.isActive ? 1 : -1),
        hiddenProducts: current.hiddenProducts + (updated.isActive ? -1 : 1),
      } : current);
    } catch (updateError) {
      Alert.alert("Unable to update listing", (updateError as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  async function changeUser(user: AdminUser, changes: {
    role?: "user" | "seller";
    sellerStatus?: AdminUser["sellerStatus"];
    isSuspended?: boolean;
  }) {
    setUpdating(user.id);
    try {
      const updated = await updateAdminUser(user.id, changes);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setAudit(await fetchAdminAudit());
    } catch (updateError) {
      Alert.alert("Unable to update account", (updateError as Error).message);
    } finally {
      setUpdating(null);
    }
  }

  if (user?.role !== "admin") {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title="Admin access required"
          subtitle="This workspace is available to administrator accounts only."
          action={
            <Pressable onPress={() => router.back()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Go back</Text>
            </Pressable>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Admin workspace</Text>
          <Text style={styles.subtitle}>Marketplace operations</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={() => void load()} accessibilityLabel="Refresh dashboard">
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(["overview", "products", "orders", "users", "audit"] as const).map((value) => (
          <Pressable
            key={value}
            style={[styles.tab, tab === value && styles.tabActive]}
            onPress={() => setTab(value)}
          >
            <Text style={[styles.tabText, tab === value && styles.tabTextActive]}>
              {value[0].toUpperCase() + value.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && !summary ? (
        <Loading />
      ) : error && !summary ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Dashboard unavailable"
          subtitle={error}
          action={
            <Pressable onPress={() => void load()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          }
        />
      ) : tab === "overview" ? (
        <FlatList
          data={[]}
          keyExtractor={() => "overview"}
          renderItem={() => null}
          contentContainerStyle={styles.content}
          refreshing={loading}
          onRefresh={load}
          ListHeaderComponent={
            <View>
              <Text style={styles.sectionTitle}>Marketplace snapshot</Text>
              <View style={styles.metricsGrid}>
                <MetricCard label="Customers" value={summary?.users ?? 0} icon="people-outline" />
                <MetricCard label="Sellers" value={summary?.sellers ?? 0} icon="storefront-outline" />
                <MetricCard label="Live listings" value={summary?.activeProducts ?? 0} icon="cube-outline" />
                <MetricCard label="Hidden listings" value={summary?.hiddenProducts ?? 0} icon="eye-off-outline" />
                <MetricCard label="Orders" value={summary?.orders ?? 0} icon="receipt-outline" />
                <MetricCard label="Awaiting payment" value={summary?.pendingOrders ?? 0} icon="time-outline" />
              </View>
              <View style={styles.salesCard}>
                <View style={styles.salesIcon}>
                  <Ionicons name="trending-up-outline" size={22} color={colors.success} />
                </View>
                <View>
                  <Text style={styles.metricLabel}>Gross sales (excluding cancelled)</Text>
                  <Text style={styles.salesValue}>{formatCurrency(summary?.grossSales ?? 0)}</Text>
                </View>
              </View>
              <Text style={styles.hint}>Use Products to review listings or Orders to progress fulfillment status.</Text>
              <Text style={styles.sectionTitle}>Sales and cancellations · last 30 days</Text>
              {trends.slice(-7).map((point) => (
                <View key={String(point.day)} style={styles.trendBlock}>
                  <View style={styles.trendRow}>
                    <Text style={styles.trendValue}>{new Date(point.day).toLocaleDateString()}</Text>
                    <Text style={styles.trendValue}>{formatCurrency(point.revenue)}</Text>
                  </View>
                  <Text style={styles.metricLabel}>
                    {point.orders} orders · {point.cancellations} cancelled · {point.activeSellers} active sellers
                  </Text>
                </View>
              ))}
            </View>
          }
        />
      ) : tab === "products" ? (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <View style={styles.entityCard}>
              <View style={styles.entityHead}>
                <View style={styles.entityText}>
                  <Text style={styles.entityTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.entityMeta}>
                    {item.sellerName || `Seller #${item.sellerId}`} · {formatCurrency(item.price)}
                  </Text>
                </View>
                <View style={[styles.statePill, item.isActive ? styles.stateOn : styles.stateOff]}>
                  <Text style={[styles.stateText, item.isActive ? styles.stateOnText : styles.stateOffText]}>
                    {item.isActive ? "Live" : "Hidden"}
                  </Text>
                </View>
              </View>
              <Text style={styles.entityMeta}>
                Stock {item.stock} · {item.categoryName || "Uncategorized"}
              </Text>
              <Pressable
                disabled={updating === item.id}
                onPress={() => void toggleProduct(item)}
                style={[styles.secondaryButton, updating === item.id && styles.disabledButton]}
              >
                <Ionicons name={item.isActive ? "eye-off-outline" : "eye-outline"} size={16} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>
                  {updating === item.id ? "Updating…" : item.isActive ? "Hide listing" : "Publish listing"}
                </Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="cube-outline" title="No listings" subtitle="Products will appear here when sellers publish them." />
          }
        />
      ) : tab === "orders" ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => {
            return (
              <View style={styles.entityCard}>
                <View style={styles.entityHead}>
                  <View>
                    <Text style={styles.entityTitle}>Order #{item.id}</Text>
                    <Text style={styles.entityMeta}>{item.buyerName || `Customer #${item.buyerId}`}</Text>
                  </View>
                  <StatusPill status={item.status} />
                </View>
                <Text style={styles.orderAmount}>{formatCurrency(item.total)}</Text>
                <Text style={styles.entityMeta}>
                  {item.items.length} line item(s) · {item.paymentMethod || "card"} · payment {item.paymentStatus || "unpaid"}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title="No orders" subtitle="Orders from customers will appear here." />
          }
        />
      ) : tab === "users" ? (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshing={loading}
          onRefresh={load}
          ListHeaderComponent={
            <TextInput
              value={userSearch}
              onChangeText={setUserSearch}
              placeholder="Search users by name or email"
              placeholderTextColor={colors.textMuted}
              style={styles.userSearch}
              autoCapitalize="none"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.entityCard}>
              <View style={styles.entityHead}>
                <View style={styles.entityText}>
                  <Text style={styles.entityTitle}>{item.name}</Text>
                  <Text style={styles.entityMeta}>{item.email} · {item.role}</Text>
                </View>
                <View style={[styles.statePill, item.isSuspended ? styles.stateOff : styles.stateOn]}>
                  <Text style={[styles.stateText, item.isSuspended ? styles.stateOffText : styles.stateOnText]}>
                    {item.isSuspended ? "Suspended" : "Active"}
                  </Text>
                </View>
              </View>
              {item.role === "seller" ? (
                <Text style={styles.entityMeta}>Seller review: {item.sellerStatus}</Text>
              ) : null}
              <View style={styles.actions}>
                {item.role === "seller" && item.sellerStatus !== "approved" ? (
                  <>
                    <Pressable style={styles.primaryButton} onPress={() => void changeUser(item, { sellerStatus: "approved" })}>
                      <Text style={styles.primaryButtonText}>Approve seller</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => void changeUser(item, { sellerStatus: "rejected" })}>
                      <Text style={styles.secondaryButtonText}>Reject</Text>
                    </Pressable>
                  </>
                ) : null}
                {item.role !== "admin" ? (
                  <Pressable
                    disabled={updating === item.id}
                    style={styles.secondaryButton}
                    onPress={() => void changeUser(item, { isSuspended: !item.isSuspended })}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {updating === item.id ? "Updating…" : item.isSuspended ? "Reactivate" : "Suspend"}
                    </Text>
                  </Pressable>
                ) : null}
                {item.role === "user" ? (
                  <Pressable style={styles.secondaryButton} onPress={() => void changeUser(item, { role: "seller", sellerStatus: "pending" })}>
                    <Text style={styles.secondaryButtonText}>Promote to seller</Text>
                  </Pressable>
                ) : item.role === "seller" ? (
                  <Pressable style={styles.secondaryButton} onPress={() => void changeUser(item, { role: "user" })}>
                    <Text style={styles.secondaryButtonText}>Set as customer</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title="No users found" subtitle="Try a different name or email." />
          }
        />
      ) : (
        <FlatList
          data={audit}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.content}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <View style={styles.entityCard}>
              <Text style={styles.entityTitle}>{item.action}</Text>
              <Text style={styles.entityMeta}>
                {item.targetType} #{item.targetId} · {item.adminName || "Administrator"} · {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.auditDetails}>{JSON.stringify(item.details)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="document-text-outline" title="No admin actions yet" subtitle="Role changes, moderation and order actions are logged here." />
          }
        />
      )}
    </Screen>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>
      <Text style={styles.metricValue}>{value.toLocaleString()}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  backButton: { width: 42, height: 42, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  headerText: { flex: 1, marginLeft: spacing.md },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: 1 },
  refreshButton: { width: 42, height: 42, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  tabs: { flexDirection: "row", marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 3 },
  tab: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface, ...shadow.soft },
  tabText: { ...typography.small, color: colors.textMuted, fontWeight: "700" },
  tabTextActive: { color: colors.primary },
  content: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, flexGrow: 1 },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.sm },
  metricCard: { width: "48%", minHeight: 116, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, ...shadow.soft },
  metricIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  metricValue: { ...typography.h2, color: colors.text, marginTop: spacing.sm },
  metricLabel: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  salesCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface, ...shadow.soft },
  salesIcon: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: "#E6F9F0", alignItems: "center", justifyContent: "center" },
  salesValue: { ...typography.h2, color: colors.text, marginTop: 2 },
  hint: { ...typography.small, color: colors.textMuted, marginTop: spacing.lg, lineHeight: 20 },
  trendRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.xs, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  trendBlock: { paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  trendValue: { ...typography.tiny, color: colors.text, fontWeight: "700" },
  trendCancel: { ...typography.tiny, color: colors.danger },
  userSearch: { height: 46, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, marginBottom: spacing.md },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  auditDetails: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.xs },
  entityCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadow.soft },
  entityHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  entityText: { flex: 1 },
  entityTitle: { ...typography.bodyStrong, color: colors.text },
  entityMeta: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.xs },
  statePill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  stateOn: { backgroundColor: "#E6F9F0" },
  stateOff: { backgroundColor: "#FFF1E6" },
  stateText: { fontSize: 11, fontWeight: "700" },
  stateOnText: { color: colors.success },
  stateOffText: { color: colors.warning },
  orderAmount: { ...typography.h3, color: colors.primary, marginTop: spacing.sm },
  primaryButton: { alignSelf: "flex-start", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primary, marginTop: spacing.md },
  primaryButtonText: { ...typography.small, color: colors.white, fontWeight: "700" },
  secondaryButton: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primarySoft, marginTop: spacing.md },
  secondaryButtonText: { ...typography.small, color: colors.primary, fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
});
