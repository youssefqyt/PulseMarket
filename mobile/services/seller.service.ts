import { apiRequest } from "./api";
import type { Order, OrderStatus, Paginated } from "../types";

export interface SellerAnalytics {
  orders: number;
  revenue: number;
  openLines: number;
  lowStockProducts: number;
  bestSellers: { id: number; title: string; stock: number; unitsSold: number; revenue: number }[];
}

export async function fetchSellerAnalytics(): Promise<SellerAnalytics> {
  return apiRequest<SellerAnalytics>("/api/seller/analytics", { auth: true });
}

export async function fetchSellerOrders(): Promise<Paginated<Order>> {
  return apiRequest<Paginated<Order>>("/api/seller/orders?limit=50", { auth: true });
}

export async function updateSellerFulfillment(
  orderId: number,
  input: {
    status?: Extract<OrderStatus, "shipped" | "completed">;
    trackingNumber?: string;
    carrier?: string;
    estimatedDeliveryAt?: string;
  }
): Promise<Order> {
  return apiRequest<Order>(`/api/seller/orders/${orderId}/fulfillment`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(input),
  });
}
