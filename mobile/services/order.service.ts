import { apiRequest } from "./api";
import type { Order, Paginated, PaymentMethod } from "../types";

export interface CreateOrderInput {
  shippingAddress: string;
  paymentMethod?: PaymentMethod;
  phone?: string;
  deliveryNotes?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
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
