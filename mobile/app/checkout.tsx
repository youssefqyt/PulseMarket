import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Screen from "../components/Screen";
import Input from "../components/Input";
import Button from "../components/Button";
import { colors, formatPrice, radius, spacing, typography } from "../constants/theme";
import { useCartStore } from "../store/cartStore";
import { createOrder } from "../services/order.service";

export default function Checkout() {
  const router = useRouter();
  const { cart, load } = useCartStore();
  const [address, setAddress] = useState("12 Avenue Habib Bourguiba, Tunis");
  const [loading, setLoading] = useState(false);

  async function placeOrder() {
    if (address.trim().length < 5) {
      Alert.alert("Address required", "Please enter a valid shipping address.");
      return;
    }
    setLoading(true);
    try {
      const order = await createOrder({ shippingAddress: address.trim() });
      await load(); // cart is now empty on the server
      Alert.alert("Order placed 🎉", `Your order #${order.id} was created.`, [
        { text: "View orders", onPress: () => router.replace("/orders") },
      ]);
    } catch (err) {
      Alert.alert("Checkout failed", (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Text style={styles.title}>Checkout</Text>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          {cart.items.map((item) => (
            <View key={item.productId} style={styles.line}>
              <Text style={styles.lineLabel} numberOfLines={1}>
                {item.quantity} × {item.title}
              </Text>
              <Text style={styles.lineValue}>{formatPrice(item.subtotal)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.line}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(cart.total)}</Text>
          </View>
        </View>

        <Input
          label="Shipping address"
          value={address}
          onChangeText={setAddress}
          multiline
          placeholder="Street, city, country"
          style={styles.address}
        />

        <Button title="Place order" onPress={placeOrder} loading={loading} />
        <Button
          title="Back to cart"
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.lg },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  line: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  lineLabel: { flex: 1, color: colors.textMuted, marginRight: spacing.md },
  lineValue: { color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  totalLabel: { ...typography.bodyStrong, color: colors.text },
  totalValue: { ...typography.h2, color: colors.primary },
  address: { height: 90, paddingTop: spacing.md, textAlignVertical: "top" },
});
