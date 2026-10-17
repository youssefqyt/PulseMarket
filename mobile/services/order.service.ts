import { apiRequest } from "./api";
import type { Order, Paginated } from "../types";

export async function createOrder(input: {
  shippingAddress: string;
}): Promise<Order> {
  return apiRequest<Order>("/api/orders", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function fetchOrders(): Promise<Paginated<Order>> {
  return apiRequest<Paginated<Order>>("/api/orders", { auth: true });
}

export async function fetchOrder(id: number): Promise<Order> {
  return apiRequest<Order>(`/api/orders/${id}`, { auth: true });
}
