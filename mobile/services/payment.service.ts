import { apiRequest } from "./api";

export async function createStripeCheckoutSession(input: {
  shippingAddress: string;
  phone?: string;
  deliveryNotes?: string;
}): Promise<{ orderId: number; sessionId: string; checkoutUrl: string }> {
  return apiRequest("/api/payments/checkout-session", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function fetchPaymentSession(sessionId: string): Promise<{
  orderId: number;
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  orderStatus: string;
}> {
  return apiRequest(`/api/payments/sessions/${encodeURIComponent(sessionId)}`, { auth: true });
}
