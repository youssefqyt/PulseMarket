import * as SecureStore from "expo-secure-store";

/**
 * Secure token storage.
 * Access/refresh tokens live in the OS keychain (expo-secure-store),
 * mirrored in memory so the API client can read them synchronously.
 */
const ACCESS_KEY = "pm_access_token";
const REFRESH_KEY = "pm_refresh_token";

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Load persisted tokens into memory. Call once at app start. */
export async function hydrateTokens(): Promise<void> {
  try {
    accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
    refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    accessToken = null;
    refreshToken = null;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  refreshToken = refresh;
  try {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  } catch {
    /* storage unavailable (web) - memory copy still works */
  }
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  try {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}
