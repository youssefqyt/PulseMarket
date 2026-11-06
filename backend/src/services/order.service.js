const ApiError = require("../utils/ApiError");
const { withTransaction } = require("../config/db");
const { mapOrder, mapOrderItem } = require("../models");
const { getPagination, paginated } = require("../utils/pagination");
const orderRepo = require("../repositories/order.repository");
const cartRepo = require("../repositories/cart.repository");
const productRepo = require("../repositories/product.repository");
const notificationRepo = require("../repositories/notification.repository");

/**
 * Create an order from either explicit items or the user's cart.
 *
 * Runs inside a single transaction with row-level locks (SELECT ... FOR UPDATE)
 * so concurrent checkouts can never oversell stock.
 */
async function createOrder(
  userId,
  { shippingAddress, paymentMethod, phone, deliveryNotes, items },
  { allowCardPayment = false } = {}
) {
  if (!paymentMethod || !["card", "cash"].includes(paymentMethod)) {
    throw ApiError.badRequest("Unsupported payment method");
  }
  if (paymentMethod === "card" && !allowCardPayment) {
    throw ApiError.badRequest("Use hosted checkout to pay by card");
  }

  const order = await withTransaction(async (client) => {
    // 1. Determine the lines to order.
    let lines = items;
    const fromCart = !lines || lines.length === 0;

    if (fromCart) {
      const cartRows = await cartRepo.getByUser(userId);
      if (cartRows.length === 0) throw ApiError.badRequest("Your cart is empty");
      lines = cartRows.map((r) => ({ productId: r.product_id, quantity: r.quantity }));
    }

    const orderItems = [];
    const lowStockAlerts = [];
    let total = 0;

    // 2. Lock, validate and decrement each product.
    for (const line of lines) {
      const product = await productRepo.findByIdForUpdate(client, line.productId);
      if (!product) throw ApiError.badRequest(`Product ${line.productId} not found`);
      if (product.seller_is_suspended || product.seller_status !== "approved") {
        throw ApiError.badRequest(`"${product.title}" is unavailable`);
      }
      if (!product.is_active) throw ApiError.badRequest(`"${product.title}" is unavailable`);
      if (product.stock < line.quantity) {
        throw ApiError.badRequest(`Not enough stock for "${product.title}"`);
      }

      const updated = await productRepo.decrementStock(client, line.productId, line.quantity);
      if (!updated) throw ApiError.conflict(`Stock changed for "${product.title}", please retry`);
      if (
        product.stock > (product.low_stock_threshold ?? 5) &&
        updated.stock <= (product.low_stock_threshold ?? 5)
      ) {
        lowStockAlerts.push({
          sellerId: product.seller_id,
          title: product.title,
          stock: updated.stock,
        });
      }

      total += Number(product.price) * line.quantity;
      orderItems.push({
        productId: product.id,
        sellerId: product.seller_id,
        title: product.title,
        price: product.price,
        quantity: line.quantity,
      });
    }

    // Determine initial status based on payment method
    const initialStatus = "pending";
    const paymentStatus = paymentMethod === "card" ? "pending" : "unpaid";

    // 3. Persist the order and its lines.
    const shippingFee = total > 50 ? 0 : 4.99;
    const created = await orderRepo.create(client, {
      buyerId: userId,
      total: Number((total + shippingFee).toFixed(2)),
      shippingAddress,
      paymentMethod,
      phone,
      deliveryNotes,
      status: initialStatus,
      paymentStatus,
    });

    const savedItems = [];
    for (const item of orderItems) {
      const savedItem = await orderRepo.addItem(client, created.id, item);
      savedItems.push(savedItem);
      await client.query(
        `INSERT INTO seller_fulfillments (order_id, seller_id)
         VALUES ($1, $2) ON CONFLICT (order_id, seller_id) DO NOTHING`,
        [created.id, item.sellerId]
      );
    }

    // 4. Empty the cart when the order came from it.
    if (fromCart) await cartRepo.clear(userId, client);

    return { order: created, items: savedItems, lowStockAlerts };
  });

  // 5. Post-commit side effect (outside the transaction).
  await notificationRepo
    .create(userId, "Order placed", `Order #${order.order.id} has been created.`)
    .catch((error) => console.warn("[orders] failed to notify buyer about order placement:", error.message));
  await Promise.all(order.lowStockAlerts.map((alert) => notificationRepo
    .create(
      alert.sellerId,
      "Low stock alert",
      `"${alert.title}" now has ${alert.stock} item(s) in stock. Replenish the listing soon.`
    )
    .catch((error) => console.warn("[orders] failed to send low-stock alert:", error.message))));

  return mapOrder(order.order, order.items.map(mapOrderItem));
}

async function listOrders(userId, query) {
  const { page, limit, offset } = getPagination(query);
  const rows = await orderRepo.listByBuyer(userId, { limit, offset });
  const total = await orderRepo.countByBuyer(userId);

  const withItems = [];
  for (const row of rows) {
    const items = await orderRepo.getItems(row.id);
    withItems.push(mapOrder(row, items.map(mapOrderItem)));
  }
  return paginated(withItems, total, page, limit);
}

async function getOrder(orderId, user) {
  const row = await orderRepo.findById(orderId);
  if (!row) throw ApiError.notFound("Order not found");
  if (row.buyer_id !== user.id && user.role !== "admin") {
    throw ApiError.forbidden("You cannot view this order");
  }
  const items = await orderRepo.getItems(orderId);
  const [statusHistory, fulfillments] = await Promise.all([
    orderRepo.listStatusHistory(orderId),
    orderRepo.listFulfillments(orderId),
  ]);
  return mapOrder({
    ...row,
    status_history: statusHistory.map((event) => ({
      status: event.status,
      note: event.note,
      createdAt: event.created_at,
    })),
    fulfillments: fulfillments.map((fulfillment) => ({
      sellerId: fulfillment.seller_id,
      sellerName: fulfillment.seller_name,
      status: fulfillment.status,
      trackingNumber: fulfillment.tracking_number,
      carrier: fulfillment.carrier,
      estimatedDeliveryAt: fulfillment.estimated_delivery_at,
      updatedAt: fulfillment.updated_at,
    })),
  }, items.map(mapOrderItem));
}

module.exports = { createOrder, listOrders, getOrder };
