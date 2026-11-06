/**
 * Row -> API shape mappers.
 * Keeps DB column naming (snake_case) out of the JSON we return.
 */

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    sellerStatus: row.seller_status || (row.role === "seller" ? "approved" : undefined),
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

function mapCategory(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug, icon: row.icon };
}

function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    sellerId: row.seller_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    price: row.price !== undefined ? Number(row.price) : undefined,
    imageUrl: row.image_url,
    imageUrls: row.image_urls || (row.image_url ? [row.image_url] : []),
    images: (row.images || []).map((image) => ({
      id: image.id,
      url: image.url,
      sortOrder: image.sortOrder,
    })),
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold ?? 5,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Optional joined fields
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    sellerName: row.seller_name,
    isFavorite: row.is_favorite,
    reviewCount: row.review_count || 0,
    averageRating: row.average_rating === undefined ? null : Number(row.average_rating),
  };
}

function mapCartItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    title: row.title,
    price: row.price !== undefined ? Number(row.price) : undefined,
    imageUrl: row.image_url,
    stock: row.stock,
    subtotal:
      row.price !== undefined ? Number(row.price) * row.quantity : undefined,
  };
}

function mapOrder(row, items = []) {
  if (!row) return null;
  return {
    id: row.id,
    buyerId: row.buyer_id,
    status: row.status,
    paymentMethod: row.payment_method || "card",
    paymentStatus: row.payment_status || "unpaid",
    total: Number(row.total),
    shippingAddress: row.shipping_address,
    phone: row.phone || null,
    deliveryNotes: row.delivery_notes || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    estimatedDeliveryAt: row.estimated_delivery_at,
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    statusHistory: row.status_history,
    fulfillments: row.fulfillments,
    items,
  };
}

function mapOrderItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    sellerId: row.seller_id,
    title: row.title,
    price: Number(row.price),
    quantity: row.quantity,
  };
}

module.exports = {
  mapUser,
  mapCategory,
  mapProduct,
  mapCartItem,
  mapOrder,
  mapOrderItem,
};
