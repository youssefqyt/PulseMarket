import { apiRequest } from "./api";
import type { Paginated, Product } from "../types";

export async function fetchFavorites(): Promise<Paginated<Product>> {
  return apiRequest<Paginated<Product>>("/api/favorites", { auth: true });
}

export async function addFavorite(productId: number): Promise<{ favorited: boolean }> {
  return apiRequest<{ favorited: boolean }>("/api/favorites", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ productId }),
  });
}

export async function removeFavorite(productId: number): Promise<{ favorited: boolean }> {
  return apiRequest<{ favorited: boolean }>(`/api/favorites/${productId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function toggleFavorite(
  productId: number,
  isFavorite: boolean
): Promise<boolean> {
  if (isFavorite) {
    await removeFavorite(productId);
    return false;
  }
  await addFavorite(productId);
  return true;
}
