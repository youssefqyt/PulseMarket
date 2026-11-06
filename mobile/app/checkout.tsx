import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Input from "../components/Input";
import Button from "../components/Button";
import { colors, formatPrice, radius, shadow, spacing, typography } from "../constants/theme";
import { useCartStore } from "../store/cartStore";
import { useSettingsStore } from "../store/settingsStore";
import { createOrder } from "../services/order.service";
import { createStripeCheckoutSession } from "../services/payment.service";
import type { PaymentMethod } from "../types";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  badge?: string;
}[] = [
  {
    id: "card",
    name: "Credit / Debit Card",
    icon: "card-outline",
    description: "Secure payment through Stripe-hosted checkout",
    badge: "Secure",
  },
  {
    id: "cash",
    name: "Cash on Delivery",
    icon: "cash-outline",
    description: "Pay in cash when package arrives at your door",
  },
];

export default function Checkout() {
  const router = useRouter();
  const { cart, load } = useCartStore();
  const defaultAddress = useSettingsStore((s) => s.defaultAddress);
  const defaultPhone = useSettingsStore((s) => s.phone);

  const [address, setAddress] = useState(defaultAddress || "12 Avenue Habib Bourguiba, Tunis");
  const [phone, setPhone] = useState(defaultPhone || "+216 20 123 456");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");

  const [loading, setLoading] = useState(false);

  // Cost calculations
  const subtotal = cart.total;
  const shippingFee = subtotal > 50 ? 0 : 4.99;
  const grandTotal = subtotal + shippingFee;

  async function placeOrder() {
    if (address.trim().length < 5) {
      Alert.alert("Address required", "Please enter a valid shipping address.");
      return;
    }
    if (phone.trim().length < 6) {
      Alert.alert("Phone required", "Please enter a valid contact phone number.");
      return;
    }

    setLoading(true);
    try {
      const input = {
        shippingAddress: address.trim(),
        phone: phone.trim(),
        deliveryNotes: deliveryNotes.trim() || undefined,
      };
      if (selectedMethod === "card") {
        const session = await createStripeCheckoutSession(input);
        await load();
        await Linking.openURL(session.checkoutUrl);
        router.replace({
          pathname: "/payment-result",
          params: { sessionId: session.sessionId, orderId: String(session.orderId), result: "success" },
        });
        return;
      }

      const order = await createOrder({ ...input, paymentMethod: "cash" });
      await load(); // cart is now empty on server

      Alert.alert(
        "Order placed",
        `Order #${order.id} is confirmed. Pay ${formatPrice(order.total)} to the courier on delivery.`,
        [
          {
            text: "View My Orders",
            onPress: () => router.replace("/orders"),
          },
        ]
      );
    } catch (err) {
      Alert.alert("Checkout failed", (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 1. Order summary */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="basket-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Order Summary ({cart.itemCount} items)</Text>
          </View>

          {cart.items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} />
              ) : (
                <View style={[styles.itemThumb, styles.itemPlaceholder]}>
                  <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.subtotal)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Subtotal</Text>
            <Text style={styles.costValue}>{formatPrice(subtotal)}</Text>
          </View>

          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Delivery Fee</Text>
            <Text style={[styles.costValue, shippingFee === 0 && styles.freeShipping]}>
              {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total to Pay</Text>
            <Text style={styles.totalValue}>{formatPrice(grandTotal)}</Text>
          </View>
        </View>

        {/* 2. Delivery & Contact Details */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Delivery Details</Text>
          </View>

          <Input
            label="Shipping Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Street address, city, postal code"
            multiline
            style={styles.addressInput}
          />

          <Input
            label="Contact Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+216 00 000 000"
            keyboardType="phone-pad"
          />

          <Input
            label="Delivery Instructions (Optional)"
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            placeholder="e.g. Leave with receptionist, floor 2..."
          />
        </View>

        {/* 3. Payment Method Selection */}
        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <Pressable
                key={method.id}
                onPress={() => setSelectedMethod(method.id)}
                style={[styles.methodCard, isSelected && styles.methodCardActive]}
              >
                <View
                  style={[
                    styles.methodIconWrapper,
                    isSelected && styles.methodIconWrapperActive,
                  ]}
                >
                  <Ionicons
                    name={method.icon}
                    size={22}
                    color={isSelected ? colors.white : colors.primary}
                  />
                </View>

                <View style={styles.methodText}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={[
                        styles.methodName,
                        isSelected && styles.methodNameActive,
                      ]}
                    >
                      {method.name}
                    </Text>
                    {method.badge ? (
                      <View style={styles.methodBadge}>
                        <Text style={styles.methodBadgeText}>{method.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.methodDesc}>{method.description}</Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterActive,
                  ]}
                >
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>
              </Pressable>
            );
          })}

          <View style={styles.methodInfoBox}>
            <Ionicons name={selectedMethod === "card" ? "lock-closed-outline" : "information-circle-outline"} size={20} color={colors.primary} />
            <Text style={styles.methodInfoText}>
              {selectedMethod === "card"
                ? "Card details are entered only on Stripe's secure hosted checkout page. PulseMarket never collects or stores your card number or security code. Stripe charges in USD."
                : `Pay ${formatPrice(grandTotal)} to the delivery courier when your order arrives.`}
            </Text>
          </View>
        </View>

        {/* 4. Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title={selectedMethod === "card"
              ? `Continue to Stripe • ${formatPrice(grandTotal)}`
              : `Place cash order • ${formatPrice(grandTotal)}`}
            onPress={placeOrder}
            loading={loading}
          />
          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
            <Text style={styles.securityText}>256-Bit SSL Encrypted & Secure Payment</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  title: { ...typography.h2, color: colors.text },
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.text, marginLeft: spacing.sm },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  itemPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemDetails: { flex: 1, marginLeft: spacing.md },
  itemTitle: { ...typography.bodyStrong, color: colors.text },
  itemQty: { ...typography.small, color: colors.textMuted },
  itemPrice: { ...typography.bodyStrong, color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  costLabel: { ...typography.body, color: colors.textMuted },
  costValue: { ...typography.bodyStrong, color: colors.text },
  freeShipping: { color: colors.success, fontWeight: "700" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  totalLabel: { ...typography.h3, color: colors.text },
  totalValue: { ...typography.h2, color: colors.primary },
  addressInput: { height: 75, textAlignVertical: "top", paddingTop: spacing.sm },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#F9F8FE",
  },
  methodIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  methodIconWrapperActive: {
    backgroundColor: colors.primary,
  },
  methodText: { flex: 1 },
  methodName: { ...typography.bodyStrong, color: colors.text },
  methodNameActive: { color: colors.primary },
  methodBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginLeft: spacing.xs,
  },
  methodBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primary },
  methodDesc: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  cardForm: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardFormTitle: { ...typography.bodyStrong, color: colors.text },
  cardLogos: { flexDirection: "row", alignItems: "center" },
  cardLogoText: { fontWeight: "800", fontSize: 13, color: "#1A1F71" },
  savedCardsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  savedCardsLabel: { ...typography.small, color: colors.textMuted, marginRight: spacing.sm },
  savedCardChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
  },
  savedCardText: { fontSize: 12, color: colors.primary, fontWeight: "600", marginLeft: 4 },
  cardRow: { flexDirection: "row" },
  saveCardSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  saveCardText: { ...typography.body, color: colors.text },
  methodInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  methodInfoText: { ...typography.small, color: colors.text, marginLeft: spacing.sm, flex: 1 },
  bankTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: 2 },
  bankDetail: { ...typography.small, color: colors.textMuted },
  actionContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  securityText: { ...typography.tiny, color: colors.textMuted, marginLeft: 6 },
});
