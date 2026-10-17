import { Image, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import QuantityStepper from "../../components/QuantityStepper";
import EmptyState from "../../components/EmptyState";
import Loading from "../../components/Loading";
import { colors, formatPrice, radius, shadow, spacing, typography } from "../../constants/theme";
import { useCartStore } from "../../store/cartStore";

export default function Cart() {
  const router = useRouter();
  const { cart, loading, load, update, remove } = useCartStore();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && cart.items.length === 0) return <Loading />;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cart</Text>
        <Text style={styles.subtitle}>{cart.itemCount} item(s)</Text>
      </View>

      <FlatList
        data={cart.items}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.placeholder]}>
                <Ionicons name="image-outline" size={22} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
              <View style={styles.controls}>
                <QuantityStepper
                  quantity={item.quantity}
                  max={item.stock}
                  onChange={(q) => update(item.productId, q)}
                />
                <Pressable onPress={() => remove(item.productId)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            subtitle="Browse the marketplace and add products to your cart."
            action={<Button title="Start shopping" onPress={() => router.push("/(tabs)")} />}
          />
        }
      />

      {cart.items.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(cart.total)}</Text>
          </View>
          <Button title="Proceed to checkout" onPress={() => router.push("/checkout")} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  image: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginLeft: spacing.md },
  itemTitle: { ...typography.bodyStrong, color: colors.text },
  price: { ...typography.bodyStrong, color: colors.primary, marginTop: 2 },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  totalLabel: { ...typography.body, color: colors.textMuted },
  totalValue: { ...typography.h2, color: colors.text },
});
