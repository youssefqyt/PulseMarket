const ApiError = require("../utils/ApiError");
const reviewRepository = require("../repositories/review.repository");
const productRepository = require("../repositories/product.repository");

function mapReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    orderItemId: row.order_item_id,
    rating: row.rating,
    body: row.body,
    sellerResponse: row.seller_response,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
  };
}

async function list(productId, query) {
  const limit = Math.min(Number(query.limit) || 20, 50);
  const page = Math.max(Number(query.page) || 1, 1);
  const [rows, summary] = await Promise.all([
    reviewRepository.listByProduct(productId, { limit, offset: (page - 1) * limit }),
    reviewRepository.countByProduct(productId),
  ]);
  return {
    items: rows.map(mapReview),
    averageRating: Number(summary.average),
    total: summary.total,
    page,
    limit,
  };
}

async function listEligibleOrderItems(productId, buyerId) {
  const rows = await reviewRepository.listEligibleOrderItems(productId, buyerId);
  return rows.map((row) => ({
    orderItemId: row.order_item_id,
    orderId: row.order_id,
    purchasedAt: row.purchased_at,
  }));
}

async function create(productId, buyerId, input) {
  const product = await productRepository.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");
  let review;
  try {
    review = await reviewRepository.createVerified({ productId, buyerId, ...input });
  } catch (error) {
    if (error.code === "23505") throw ApiError.conflict("This purchase already has a review");
    throw error;
  }
  if (!review) {
    throw ApiError.forbidden("A completed, paid purchase is required before reviewing this product");
  }
  return mapReview(review);
}

async function respond(reviewId, sellerId, response) {
  const review = await reviewRepository.respond(reviewId, sellerId, response);
  if (!review) throw ApiError.notFound("Review not found for this seller");
  return mapReview(review);
}

module.exports = { list, listEligibleOrderItems, create, respond };
