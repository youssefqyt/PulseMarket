const Stripe = require("stripe");
const config = require("../config");
const ApiError = require("../utils/ApiError");
const orderService = require("./order.service");
const orderRepository = require("../repositories/order.repository");
const cartRepository = require("../repositories/cart.repository");
const notificationRepository = require("../repositories/notification.repository");

const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null;

async function createCheckoutSession(userId, input) {
  if (!stripe) throw new ApiError(503, "Stripe is not configured. Set STRIPE_SECRET_KEY.");

  const order = await orderService.createOrder(userId, {
    ...input,
    paymentMethod: "card",
  }, { allowCardPayment: true });
  let session;
  try {
    const subtotal = order.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const shippingFee = subtotal > 50 ? 0 : 4.99;
    const lineItems = order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(item.price) * 100),
        product_data: { name: item.title },
      },
    }));
    if (shippingFee > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(shippingFee * 100),
          product_data: { name: "Delivery fee" },
        },
      });
    }
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: String(order.id),
      metadata: { orderId: String(order.id), buyerId: String(userId) },
      line_items: lineItems,
      success_url: config.stripe.successUrl,
      cancel_url: config.stripe.cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    if (!session.url) throw new ApiError(502, "Stripe did not return a hosted checkout URL");
    const updatedOrder = await orderRepository.setStripeSession(order.id, session.id);
    if (!updatedOrder) throw ApiError.notFound("Order disappeared before checkout was linked");
    return { orderId: order.id, sessionId: session.id, checkoutUrl: session.url };
  } catch (error) {
    if (session) {
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error("[payments] could not expire an unlinked Stripe session:", expireError.message);
        throw new ApiError(502, "Checkout could not be completed. The order remains reserved until the payment session expires.");
      }
    }
    const cancelled = await orderRepository.cancelAndRestock(order.id);
    if (cancelled) {
      await cartRepository.restoreItems(userId, order.items);
    }
    throw error;
  }
}

async function getSessionStatus(userId, sessionId) {
  const order = await orderRepository.findByStripeSession(sessionId);
  if (!order || order.buyer_id !== userId) throw ApiError.notFound("Payment session not found");
  return { orderId: order.id, paymentStatus: order.payment_status, orderStatus: order.status };
}

async function handleWebhook(rawBody, signature) {
  if (!stripe || !config.stripe.webhookSecret) {
    throw new ApiError(503, "Stripe webhook is not configured");
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch {
    throw ApiError.badRequest("Invalid Stripe webhook signature");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = Number(session.metadata?.orderId || session.client_reference_id);
    if (!orderId || session.payment_status !== "paid") return { received: true };
    const order = await orderRepository.updatePayment(orderId, "paid", "paid");
    if (order) {
      await notificationRepository.create(
        order.buyer_id,
        "Payment received",
        `Payment for order #${order.id} was confirmed.`
      );
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const orderId = Number(session.metadata?.orderId || session.client_reference_id);
    if (orderId) await orderRepository.cancelAndRestock(orderId);
  }
  return { received: true };
}

module.exports = { createCheckoutSession, getSessionStatus, handleWebhook };
