const ApiError = require("../utils/ApiError");
const { mapOrder, mapOrderItem } = require("../models");
const { getPagination, paginated } = require("../utils/pagination");
const sellerRepository = require("../repositories/seller.repository");
const notificationRepository = require("../repositories/notification.repository");
const orderRepository = require("../repositories/order.repository");

async function listOrders(sellerId, query) {
  const { page, limit, offset } = getPagination(query);
  const [rows, total] = await Promise.all([
    sellerRepository.listOrders(sellerId, { limit, offset }),
    sellerRepository.countOrders(sellerId),
  ]);
  const orders = await Promise.all(rows.map(async (row) => {
    const items = await sellerRepository.getOrderItems(sellerId, row.id);
    const fulfillment = await sellerRepository.getFulfillment(sellerId, row.id);
    return {
      ...mapOrder(row, items.map(mapOrderItem)),
      sellerFulfillment: fulfillment,
    };
  }));
  return paginated(orders, total, page, limit);
}

async function getAnalytics(sellerId) {
  const result = await sellerRepository.getAnalytics(sellerId);
  return {
    orders: result.orders,
    revenue: result.revenue,
    openLines: result.open_lines,
    lowStockProducts: result.low_stock_products,
    bestSellers: result.bestSellers,
  };
}

async function updateFulfillment(sellerId, orderId, data) {
  if (data.status && !["shipped", "completed"].includes(data.status)) {
    throw ApiError.badRequest("Sellers may only mark orders shipped or completed");
  }
  const prior = await sellerRepository.getFulfillment(sellerId, orderId);
  if (!prior) throw ApiError.notFound("Order not found for this seller");
  const currentOrder = await orderRepository.findById(orderId);
  if (
    !currentOrder ||
    (currentOrder.payment_status !== "paid" &&
      !(currentOrder.payment_method === "cash" && ["pending", "unpaid"].includes(currentOrder.payment_status)))
  ) {
    throw ApiError.badRequest("Payment must be confirmed before fulfillment");
  }
  if (data.status === "shipped" && prior.status !== "pending") {
    throw ApiError.badRequest("Only pending seller shipments can be marked shipped");
  }
  if (data.status === "completed" && prior.status !== "shipped") {
    throw ApiError.badRequest("Only shipped seller shipments can be completed");
  }
  const updated = await sellerRepository.updateFulfillment(sellerId, orderId, data);
  if (!updated) throw ApiError.notFound("Order not found for this seller");
  if (data.status && updated.buyer_id) {
    await notificationRepository.create(
      updated.buyer_id,
      "Order tracking updated",
      `Order #${orderId} is now ${updated.fulfillment_status}${updated.tracking_number ? ` (${updated.tracking_number})` : ""}.`
    ).catch((error) => console.warn("[seller] failed to notify buyer about shipment update:", error.message));
  }
  const finalOrder = await orderRepository.findById(orderId);
  const items = await sellerRepository.getOrderItems(sellerId, orderId);
  return {
    ...mapOrder(finalOrder, items.map(mapOrderItem)),
    sellerFulfillment: await sellerRepository.getFulfillment(sellerId, orderId),
  };
}

module.exports = { listOrders, getAnalytics, updateFulfillment };
