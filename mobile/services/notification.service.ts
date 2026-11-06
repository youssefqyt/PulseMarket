import { apiRequest } from "./api";
import type { Notification } from "../types";

export async function fetchNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>("/api/notifications", { auth: true });
}

export async function markNotificationRead(id: number): Promise<Notification> {
  return apiRequest<Notification>(`/api/notifications/${id}/read`, {
    method: "PATCH",
    auth: true,
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<{ message: string }>("/api/notifications/read-all", {
    method: "POST",
    auth: true,
  });
}

