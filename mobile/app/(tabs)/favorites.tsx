import { useCallback, useState } from "react";
import { Alert, FlatList, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as ExpoLinking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import ProductCard from "../../components/ProductCard";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useCartStore } from "../../store/cartStore";
import { useSettingsStore } from "../../store/settingsStore";
import { fetchFavorites } from "../../services/favorite.service";
import {
  createWishlistShare,
  fetchPriceAlerts,
  removePriceAlert,
  setPriceAlert,
  type PriceAlert,
} from "../../services/wishlist.service";
import type { Product } from "../../types";

export default function Favorites() {
  const router = useRouter();
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.add);
  const formatCurrency = useSettingsStore((state) => state.formatCurrency);

  const [items, setItems] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertProduct, setAlertProduct] = useState<Product | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, nextAlerts] = await Promise.all([fetchFavorites(), fetchPriceAlerts()]);
      setItems(result.items);
      setAlerts(nextAlerts);
    } catch (error) {
      Alert.alert("Favorites unavailable", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh every time the tab gains focus so removed items disappear.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onToggle(id: number) {
    setItems((prev) => prev.filter((p) => p.id !== id));
    try {
      await toggleFavorite(id);
    } catch (error) {
      Alert.alert("Could not update favorites", (error as Error).message);
      await load();
    }
  }

  async function onShare() {
    try {
      if (items.length === 0) {
        Alert.alert("Nothing to share", "Add products to your favorites first.");
        return;
      }
      const share = await createWishlistShare();
      const url = process.env.EXPO_PUBLIC_APP_URL
        ? `${process.env.EXPO_PUBLIC_APP_URL.replace(/\/$/, "")}/shared-wishlist?token=${share.token}`
        : ExpoLinking.createURL("shared-wishlist", { queryParams: { token: share.token } });
      await Share.share({ message: `My PulseMarket wishlist: ${url}`, url });
    } catch (error) {
      Alert.alert("Could not share wishlist", (error as Error).message);
    }
  }

  async function saveAlert() {
    if (!alertProduct) return;
    const price = Number(targetPrice);
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert("Invalid target price", "Enter a price greater than zero.");
      return;
    }
    try {
      const alert = await setPriceAlert(alertProduct.id, alertProduct.title, alertProduct.price, price);
      setAlerts((current) => [...current.filter((item) => item.productId !== alert.productId), alert]);
      setAlertProduct(null);
    } catch (error) {
      Alert.alert("Could not set price alert", (error as Error).message);
    }
  }

  async function clearAlert(productId: number) {
    try {
      await removePriceAlert(productId);
      setAlerts((current) => current.filter((item) => item.productId !== productId));
    } catch (error) {
      Alert.alert("Could not remove price alert", (error as Error).message);
    }
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>{items.length} saved item(s)</Text>
        </View>
        <Pressable onPress={() => void onShare()} style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={18} color={colors.primary} />
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={alerts.length ? (
            <View style={styles.alertsSection}>
              <Text style={styles.alertsTitle}>Active price alerts</Text>
              {alerts.map((alert) => (
                <View key={alert.productId} style={styles.activeAlert}>
                  <Text style={styles.activeAlertText} numberOfLines={1}>
                    {alert.title} · target {formatCurrency(alert.targetPrice)}
                  </Text>
                  <Pressable onPress={() => void clearAlert(alert.productId)} accessibilityLabel={`Remove alert for ${alert.title}`}>
                    <Ionicons name="close-circle" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          renderItem={({ item }) => (
            <View style={styles.productWrap}>
              <ProductCard
                product={item}
                width="100%"
                isFavorite={favoriteIds.has(item.id)}
                onToggleFavorite={() => onToggle(item.id)}
                onAddToCart={() => addToCart(item.id, 1)}
                onPress={() => router.push(`/product/${item.id}`)}
              />
              <Pressable
                style={styles.alertButton}
                onPress={() => {
                  setAlertProduct(item);
                  setTargetPrice(String(item.price));
                }}
              >
                <Ionicons name="notifications-outline" size={15} color={colors.primary} />
                <Text style={styles.alertButtonText}>
                  {alerts.some((alert) => alert.productId === item.id) ? "Edit price alert" : "Set price alert"}
                </Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="No favorites yet"
              subtitle="Tap the heart on any product to save it here."
            />
          }
        />
      )}
      <Modal visible={Boolean(alertProduct)} transparent animationType="fade" onRequestClose={() => setAlertProduct(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Price alert</Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>{alertProduct?.title}</Text>
            <TextInput
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="decimal-pad"
              placeholder="Target price"
              placeholderTextColor={colors.textMuted}
              style={styles.priceInput}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setAlertProduct(null)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void saveAlert()} style={styles.saveButton}>
                <Text style={styles.saveText}>Save alert</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  headerText: { flex: 1 },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: { justifyContent: "space-between", marginBottom: spacing.lg },
  shareButton: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  shareText: { ...typography.small, color: colors.primary, fontWeight: "700" },
  alertsSection: { marginBottom: spacing.md },
  alertsTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.xs },
  activeAlert: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs, gap: spacing.sm },
  activeAlertText: { ...typography.tiny, color: colors.textMuted, flex: 1 },
  productWrap: { width: "48%" },
  alertButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: spacing.sm, marginTop: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  alertButtonText: { ...typography.tiny, color: colors.primary, fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  modalCard: { width: "100%", maxWidth: 420, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface },
  modalTitle: { ...typography.h3, color: colors.text },
  modalSubtitle: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs },
  priceInput: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, marginTop: spacing.md, color: colors.text },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md },
  cancelButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  cancelText: { ...typography.small, color: colors.textMuted, fontWeight: "700" },
  saveButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  saveText: { ...typography.small, color: colors.white, fontWeight: "700" },
});
