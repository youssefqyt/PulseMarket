import { apiRequest } from "./api";
import type { Category, Paginated, Product, ProductReview } from "../types";

export interface ProductQuery {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "popularity" | "rating";
}

function toQueryString(query: ProductQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
  return apiRequest<Paginated<Product>>(`/api/products${toQueryString(query)}`, {
    auth: true,
  });
}

export async function suggestProducts(q: string): Promise<{ id: number; title: string; imageUrl?: string; price: number }[]> {
  const params = new URLSearchParams({ q, limit: "6" });
  return apiRequest(`/api/products/suggest?${params.toString()}`);
}

export async function uploadProductImages(
  productId: number,
  images: { uri: string; fileName: string; mimeType: string }[]
): Promise<{ id: number; url: string; sortOrder: number }[]> {
  const form = new FormData();
  const nativeForm = form as FormData & {
    append(name: string, value: { uri: string; name: string; type: string }): void;
  };
  for (const [index, image] of images.entries()) {
    nativeForm.append("images", {
      uri: image.uri,
      name: image.fileName || `product-${productId}-${index}.jpg`,
      type: image.mimeType || "image/jpeg",
    });
  }
  return apiRequest(`/api/products/${productId}/images`, {
    method: "POST",
    auth: true,
    body: form,
  });
}

export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  await apiRequest(`/api/products/${productId}/images/${imageId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function fetchProductReviews(productId: number): Promise<{
  items: ProductReview[];
  averageRating: number;
  total: number;
  page: number;
  limit: number;
}> {
  return apiRequest(`/api/products/${productId}/reviews`);
}

export async function createProductReview(
  productId: number,
  input: { orderItemId: number; rating: number; body: string }
): Promise<ProductReview> {
  return apiRequest(`/api/products/${productId}/reviews`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function fetchEligibleReviewOrderItems(productId: number): Promise<{
  orderItemId: number;
  orderId: number;
  purchasedAt: string;
}[]> {
  return apiRequest(`/api/products/${productId}/reviews/eligible-items`, { auth: true });
}

export async function respondToProductReview(
  reviewId: number,
  response: string
): Promise<ProductReview> {
  return apiRequest(`/api/reviews/${reviewId}/response`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ response }),
  });
}

export async function fetchMyProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/api/products/mine", { auth: true });
}

export async function fetchProduct(id: number): Promise<Product> {
  return apiRequest<Product>(`/api/products/${id}`, { auth: true });
}

export async function fetchCategories(withCounts = true): Promise<Category[]> {
  return apiRequest<Category[]>(
    `/api/categories${withCounts ? "?withCounts=true" : ""}`
  );
}

export interface CreateProductInput {
  title: string;
  categoryId?: number;
  price: number;
  stock: number;
  lowStockThreshold?: number;
  description?: string;
  imageUrl?: string;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  return apiRequest<Product>("/api/products", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function updateProduct(
  id: number,
  input: Partial<CreateProductInput> & { isActive?: boolean }
): Promise<Product> {
  return apiRequest<Product>(`/api/products/${id}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(id: number): Promise<void> {
  await apiRequest(`/api/products/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
