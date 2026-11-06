const { mapProduct, mapOrder, mapOrderItem } = require("../models");
const { getPagination, paginated } = require("../utils/pagination");
const adminRepository = require("../repositories/admin.repository");
const orderRepository = require("../repositories/order.repository");
const ApiError = require("../utils/ApiError");
const cache = require("../config/redis");

async function getSummary() {
  const summary = await adminRepository.getSummary();
  return {
    users: summary.users,
    sellers: summary.sellers,
    activeProducts: summary.active_products,
    hiddenProducts: summary.hidden_products,
    orders: summary.orders,
    pendingOrders: summary.pending_orders,
    grossSales: Number(summary.gross_sales),
  };
}

async function listProducts(query) {
  const { page, limit, offset } = getPagination(query);
  const [rows, total] = await Promise.all([
    adminRepository.listProducts({ limit, offset }),
    adminRepository.countProducts(),
  ]);
  return paginated(rows.map(mapProduct), total, page, limit);
}

async function listOrders(query) {
  const { page, limit, offset } = getPagination(query);
  const [rows, total] = await Promise.all([
    orderRepository.listAll({ limit, offset }),
    orderRepository.countAll(),
  ]);
  const orders = await Promise.all(
    rows.map(async (row) => {
      const items = await orderRepository.getItems(row.id);
      return mapOrder(row, items.map(mapOrderItem));
    })
  );
  return paginated(orders, total, page, limit);
}

async function listUsers(query) {
  const { page, limit, offset } = getPagination(query);
  const search = String(query.q || "").trim();
  const [rows, total] = await Promise.all([
    adminRepository.listUsers({ search, limit, offset }),
    adminRepository.countUsers(search),
  ]);
  return paginated(rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    sellerStatus: row.seller_status,
    isSuspended: row.is_suspended,
    createdAt: row.created_at,
  })), total, page, limit);
}

async function updateUser(adminId, userId, changes) {
  if (adminId === userId && (changes.isSuspended === true || changes.role === "user")) {
    throw ApiError.badRequest("You cannot suspend or demote your own admin account");
  }
  const result = await adminRepository.updateUserWithAudit(adminId, userId, changes);
  if (!result) throw ApiError.notFound("User not found");
  const { updated } = result;
  await cache.delByPrefix("products:list:");
  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    sellerStatus: updated.seller_status,
    isSuspended: updated.is_suspended,
    createdAt: updated.created_at,
  };
}

async function listAudit(query) {
  const { limit, offset } = getPagination(query);
  const rows = await adminRepository.listAudit({ limit, offset });
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    details: row.details,
    createdAt: row.created_at,
    adminName: row.admin_name,
    adminEmail: row.admin_email,
  }));
}

async function getSalesTrends() {
  return adminRepository.getSalesTrends();
}

module.exports = { getSummary, listProducts, listOrders, listUsers, updateUser, listAudit, getSalesTrends };
