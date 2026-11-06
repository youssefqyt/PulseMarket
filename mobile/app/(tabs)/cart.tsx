import { Alert, Image, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import QuantityStepper from "../../components/QuantityStepper";
import EmptyState from "../../components/EmptyState";
import Loading from "../../components/Loading";
import { colors, radius, shadow, spacing, typography } from "../../constants/theme";
import { useCartStore } from "../../store/cartStore";
import { useSettingsStore } from "../../store/settingsStore";

export default function Cart() {
  const router = useRouter();
  const { cart, loading, load, update, remove, clear } = useCartStore();
  const formatCurrency = useSettingsStore((s) => s.formatCurrency);

  function confirmClearCart() {
    Alert.alert("Clear cart?", "This will remove all items from your cart.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear cart",
        style: "destructive",
        onPress: () => {
          clear().catch((error: Error) => {
            Alert.alert("Unable to clear cart", error.message);
          });
        },
      },
    ]);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && cart.items.length === 0) return <Loading />;

  // Shipping estimate: free above $50
  const shippingFee = cart.total > 50 ? 0 : cart.total > 0 ? 4.99 : 0;
  const grandTotal = cart.total + shippingFee;

  return (
    <Screen padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Cart</Text>
        <View style={styles.headerRight}>
          <Text style={styles.subtitle}>{cart.itemCount} item(s)</Text>
          {cart.items.length > 0 ? (
            <Pressable style={styles.clearBtn} onPress={confirmClearCart} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={cart.items}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable onPress={() => router.push(`/product/${item.productId}`)}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Ionicons name="cube-outline" size={22} color={colors.textMuted} />
                </View>
              )}
            </Pressable>

            <View style={styles.info}>
              <Pressable onPress={() => router.push(`/product/${item.productId}`)}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </Pressable>
              <Text style={styles.price}>{formatCurrency(item.price)}</Text>
              <Text style={styles.subtotalLine}>
                Subtotal: {formatCurrency(item.subtotal)}
              </Text>

              <View style={styles.controls}>
                <QuantityStepper
                  quantity={item.quantity}
                  max={item.stock}
                  onChange={(q) => update(item.productId, q)}
                />
                <Pressable
                  onPress={() => remove(item.productId)}
                  hitSlop={8}
                  style={styles.removeBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            subtitle="Browse the marketplace and tap the cart icon or the quick-add button on any product."
            action={<Button title="Start Shopping" onPress={() => router.push("/(tabs)")} />}
          />
        }
      />

      {cart.items.length > 0 ? (
        <View style={styles.footer}>
          {/* Cost breakdown */}
          <View style={styles.costSection}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Subtotal</Text>
              <Text style={styles.costValue}>{formatCurrency(cart.total)}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>
                Delivery {cart.total > 50 ? "🎉" : ""}
              </Text>
              <Text
                style={[styles.costValue, shippingFee === 0 && styles.freeShipping]}
              >
                {shippingFee === 0 ? "FREE" : formatCurrency(shippingFee)}
              </Text>
            </View>
            {shippingFee > 0 ? (
              <Text style={styles.freeShippingHint}>
                Add {formatCurrency(50 - cart.total)} more to get free delivery!
              </Text>
            ) : null}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>

          {/* CTA */}
          <Button
            title="Proceed to Checkout →"
            onPress={() => router.push("/checkout")}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.text },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  subtitle: { ...typography.small, color: colors.textMuted },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFECEC",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 99,
  },
  clearBtnText: { fontSize: 12, fontWeight: "700", color: colors.danger, marginLeft: 3 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  placeholder: { alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginLeft: spacing.md },
  itemTitle: { ...typography.bodyStrong, color: colors.text },
  price: { ...typography.small, color: colors.textMuted, marginTop: 1 },
  subtotalLine: { ...typography.bodyStrong, color: colors.primary, marginTop: 2 },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  removeBtn: {
    padding: spacing.xs,
    borderRadius: 99,
    backgroundColor: "#FFECEC",
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  costSection: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  costLabel: { ...typography.body, color: colors.textMuted },
  costValue: { ...typography.bodyStrong, color: colors.text },
  freeShipping: { color: colors.success, fontWeight: "800" },
  freeShippingHint: {
    ...typography.tiny,
    color: colors.primary,
    marginBottom: spacing.xs,
    marginTop: 2,
    textAlign: "right",
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { ...typography.h3, color: colors.text },
  totalValue: { ...typography.h2, color: colors.primary },
});
