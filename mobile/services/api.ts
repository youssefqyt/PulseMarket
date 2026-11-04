import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./tokenStore";
import type { ApiEnvelope } from "../types";

/**
 * Resolve the API base URL.
 * Priority: EXPO_PUBLIC_API_URL -> platform default.
 * Android emulators use 10.0.2.2 to reach the host; iOS simulators use localhost.
 * Physical devices should set EXPO_PUBLIC_API_URL to the host machine's LAN IP.
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000");

export class ApiError extends Error {
  status: number;
  details?: { field: string; message: string }[];

  constructor(status: number, message: string, details?: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = RequestInit & { auth?: boolean; _retried?: boolean };

/** Single-flight refresh so parallel 401s only refresh once. */
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!res.ok) return false;
        const json = (await res.json()) as ApiEnvelope<{
          accessToken: string;
          refreshToken: string;
        }>;
        await setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        // Reset after the microtask so concurrent callers share the result.
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      }
    })();
  }
  return refreshPromise;
}

/**
 * Core request helper.
 * Adds JSON headers + bearer token, unwraps the { success, data } envelope,
 * and transparently refreshes the access token once on a 401.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = false, _retried = false, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...rest, headers: finalHeaders });
  } catch (err) {
    throw new ApiError(0, "Network error - is the API running and reachable?");
  }

  // Attempt one silent refresh + retry on an expired access token.
  if (response.status === 401 && auth && !_retried) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiRequest<T>(endpoint, { ...options, _retried: true });
    }
    await clearTokens();
  }

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const envelope = body as ApiEnvelope<unknown> | null;
    const message = envelope?.error?.message || `Request failed (${response.status})`;
    throw new ApiError(response.status, message, envelope?.error?.details);
  }

  // Unwrap the standard envelope.
  if (body && typeof body === "object" && "success" in body) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}
