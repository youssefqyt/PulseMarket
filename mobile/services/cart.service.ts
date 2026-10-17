import { apiRequest } from "./api";
import type { Cart } from "../types";

export async function fetchCart(): Promise<Cart> {
  return apiRequest<Cart>("/api/cart", { auth: true });
}

export async function addToCart(productId: number, quantity = 1): Promise<Cart> {
  return apiRequest<Cart>("/api/cart", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(productId: number, quantity: number): Promise<Cart> {
  return apiRequest<Cart>(`/api/cart/${productId}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(productId: number): Promise<Cart> {
  return apiRequest<Cart>(`/api/cart/${productId}`, { method: "DELETE", auth: true });
}

export async function clearCart(): Promise<Cart> {
  return apiRequest<Cart>("/api/cart", { method: "DELETE", auth: true });
}
