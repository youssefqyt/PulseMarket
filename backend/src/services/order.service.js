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
async function createOrder(userId, { shippingAddress, items }) {
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
    let total = 0;

    // 2. Lock, validate and decrement each product.
    for (const line of lines) {
      const product = await productRepo.findByIdForUpdate(client, line.productId);
      if (!product) throw ApiError.badRequest(`Product ${line.productId} not found`);
      if (!product.is_active) throw ApiError.badRequest(`"${product.title}" is unavailable`);
      if (product.stock < line.quantity) {
        throw ApiError.badRequest(`Not enough stock for "${product.title}"`);
      }

      const updated = await productRepo.decrementStock(client, line.productId, line.quantity);
      if (!updated) throw ApiError.conflict(`Stock changed for "${product.title}", please retry`);

      total += Number(product.price) * line.quantity;
      orderItems.push({
        productId: product.id,
        sellerId: product.seller_id,
        title: product.title,
        price: product.price,
        quantity: line.quantity,
      });
    }

    // 3. Persist the order and its lines.
    const created = await orderRepo.create(client, {
      buyerId: userId,
      total: Number(total.toFixed(2)),
      shippingAddress,
      status: "pending",
    });

    const savedItems = [];
    for (const item of orderItems) {
      savedItems.push(await orderRepo.addItem(client, created.id, item));
    }

    // 4. Empty the cart when the order came from it.
    if (fromCart) await cartRepo.clear(userId, client);

    return { order: created, items: savedItems };
  });

  // 5. Post-commit side effect (outside the transaction).
  await notificationRepo
    .create(userId, "Order placed", `Order #${order.order.id} has been created.`)
    .catch(() => {});

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
  return mapOrder(row, items.map(mapOrderItem));
}

async function updateStatus(orderId, status, user) {
  const row = await orderRepo.findById(orderId);
  if (!row) throw ApiError.notFound("Order not found");
  if (row.buyer_id !== user.id && user.role !== "admin") {
    throw ApiError.forbidden("You cannot modify this order");
  }
  const updated = await orderRepo.updateStatus(orderId, status);
  const items = await orderRepo.getItems(orderId);
  return mapOrder(updated, items.map(mapOrderItem));
}

module.exports = { createOrder, listOrders, getOrder, updateStatus };
