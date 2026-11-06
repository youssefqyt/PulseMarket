import { apiRequest } from "./api";
import { setTokens, clearTokens } from "./tokenStore";
import type { AuthResponse, User } from "../types";

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role?: "user" | "seller";
}): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function fetchMe(): Promise<User> {
  return apiRequest<User>("/api/auth/me", { auth: true });
}

export async function updateProfile(input: {
  name?: string;
  avatarUrl?: string | null;
}): Promise<User> {
  return apiRequest<User>("/api/auth/profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/change-password", {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export async function logout(refreshToken: string | null): Promise<void> {
  await clearTokens();

  if (refreshToken) {
    void apiRequest("/api/auth/logout", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
}
