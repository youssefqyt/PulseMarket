import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Loading from "../components/Loading";
import Button from "../components/Button";
import { colors, radius, spacing, typography } from "../constants/theme";
import { fetchPaymentSession } from "../services/payment.service";

type ResultState = "checking" | "paid" | "cancelled" | "pending" | "error";

export default function PaymentResult() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId?: string;
    session_id?: string;
    orderId?: string;
    result?: string;
  }>();
  const rawSessionId = params.sessionId || params.session_id;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const result = Array.isArray(params.result) ? params.result[0] : params.result;
  const [state, setState] = useState<ResultState>(result === "cancelled" ? "cancelled" : "checking");
  const [error, setError] = useState("");
  const [resolvedOrderId, setResolvedOrderId] = useState(orderId);

  useEffect(() => {
    if (result === "cancelled") {
      setState("cancelled");
      return;
    }
    if (!sessionId) {
      setState("error");
      setError("The payment confirmation link did not include a session ID.");
      return;
    }

    let active = true;
    async function checkStatus() {
      let lastError = "";
      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          const result = await fetchPaymentSession(sessionId);
          if (!active) return;
          setResolvedOrderId(String(result.orderId));
          if (result.paymentStatus === "paid") {
            setState("paid");
            return;
          }
          if (result.paymentStatus === "failed" || result.paymentStatus === "refunded") {
            setState("error");
            setError(`Payment status: ${result.paymentStatus}.`);
            return;
          }
        } catch (requestError) {
          if (!active) return;
          lastError = (requestError as Error).message;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      if (active) {
        setError(lastError);
        setState(lastError ? "error" : "pending");
      }
    }

    void checkStatus();
    return () => {
      active = false;
    };
  }, [result, sessionId]);

  if (state === "checking") return <Loading />;

  const title = state === "paid"
    ? "Payment confirmed"
    : state === "cancelled"
      ? "Checkout cancelled"
      : state === "pending"
        ? "Payment is processing"
        : "Payment could not be confirmed";
  const message = state === "paid"
    ? `Your order${resolvedOrderId ? ` #${resolvedOrderId}` : ""} has been paid.`
    : state === "cancelled"
      ? "No payment was confirmed. You can return to checkout and try again."
      : state === "pending"
        ? "Stripe has not confirmed the payment yet. Check your orders again in a moment."
        : error || "Please check your orders or contact support before trying again.";

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.icon, state === "paid" ? styles.successIcon : styles.infoIcon]}>
          <Ionicons
            name={state === "paid" ? "checkmark" : state === "error" ? "alert" : "time-outline"}
            size={32}
            color={state === "paid" ? colors.success : colors.primary}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {state === "paid" || state === "pending" ? (
          <Button title="View my orders" onPress={() => router.replace("/orders")} />
        ) : (
          <Button title="Continue shopping" onPress={() => router.replace("/(tabs)")} />
        )}
        {state !== "paid" ? (
          <Pressable onPress={() => router.replace("/orders")} style={styles.secondary}>
            <Text style={styles.secondaryText}>Check order history</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  icon: { width: 72, height: 72, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  successIcon: { backgroundColor: "#E6F9F0" },
  infoIcon: { backgroundColor: colors.primarySoft },
  title: { ...typography.h2, color: colors.text, textAlign: "center" },
  message: { ...typography.body, color: colors.textMuted, textAlign: "center", lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.xl },
  secondary: { padding: spacing.md },
  secondaryText: { ...typography.small, color: colors.primary, fontWeight: "700" },
});
