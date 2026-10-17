import { apiRequest } from "./api";
import type { Category, Paginated, Product } from "../types";

export interface ProductQuery {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  sort?: "newest" | "price_asc" | "price_desc";
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

export async function fetchProduct(id: number): Promise<Product> {
  return apiRequest<Product>(`/api/products/${id}`, { auth: true });
}

export async function fetchCategories(withCounts = true): Promise<Category[]> {
  return apiRequest<Category[]>(
    `/api/categories${withCounts ? "?withCounts=true" : ""}`
  );
}
