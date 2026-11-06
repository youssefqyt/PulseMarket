import { apiRequest } from "./api";
import type { Order, Paginated, Product } from "../types";

export interface AdminSummary {
  users: number;
  sellers: number;
  activeProducts: number;
  hiddenProducts: number;
  orders: number;
  pendingOrders: number;
  grossSales: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "user" | "seller" | "admin";
  sellerStatus: "pending" | "approved" | "rejected";
  isSuspended: boolean;
  createdAt: string;
}

export async function fetchAdminTrends(): Promise<{
  day: string;
  orders: number;
  cancellations: number;
  revenue: number;
  activeSellers: number;
}[]> {
  return apiRequest("/api/admin/trends", { auth: true });
}

export async function fetchAdminUsers(q = ""): Promise<Paginated<AdminUser>> {
  const params = new URLSearchParams({ limit: "50" });
  if (q) params.set("q", q);
  return apiRequest(`/api/admin/users?${params.toString()}`, { auth: true });
}

export async function updateAdminUser(
  id: number,
  changes: { role?: "user" | "seller"; sellerStatus?: AdminUser["sellerStatus"]; isSuspended?: boolean }
): Promise<AdminUser> {
  return apiRequest(`/api/admin/users/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(changes),
  });
}

export async function fetchAdminAudit(): Promise<{
  id: number;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
  adminName?: string;
}[]> {
  return apiRequest("/api/admin/audit?limit=50", { auth: true });
}

export async function fetchAdminSummary(): Promise<AdminSummary> {
  return apiRequest<AdminSummary>("/api/admin/summary", { auth: true });
}

export async function fetchAdminProducts(): Promise<Paginated<Product>> {
  return apiRequest<Paginated<Product>>("/api/admin/products?limit=50", { auth: true });
}

export async function setProductVisibility(id: number, isActive: boolean): Promise<Product> {
  return apiRequest<Product>(`/api/admin/products/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ isActive }),
  });
}

export async function fetchAdminOrders(): Promise<Paginated<Order>> {
  return apiRequest<Paginated<Order>>("/api/admin/orders?limit=50", { auth: true });
}
