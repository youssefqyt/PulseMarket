import { create } from "zustand";
import * as authService from "../services/auth.service";
import { hydrateTokens, clearTokens, getRefreshToken } from "../services/tokenStore";
import type { User } from "../types";

type Status = "loading" | "authenticated" | "guest";

interface AuthState {
  user: User | null;
  status: Status;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, role?: "user" | "seller") => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUser: (name?: string, avatarUrl?: string | null) => Promise<User>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  let sessionVersion = 0;

  return {
  user: null,
  status: "loading",
  error: null,

  /** Called once on app start: restore tokens and fetch the current user. */
  initialize: async () => {
    const version = ++sessionVersion;
    await hydrateTokens();
    if (version !== sessionVersion) return;
    try {
      const user = await authService.fetchMe();
      if (version === sessionVersion) set({ user, status: "authenticated" });
    } catch {
      if (version === sessionVersion) {
        await clearTokens();
        set({ user: null, status: "guest" });
      }
    }
  },

  signIn: async (email, password) => {
    const version = ++sessionVersion;
    set({ error: null });
    try {
      const { user } = await authService.login({ email, password });
      if (version === sessionVersion) set({ user, status: "authenticated" });
    } catch (err) {
      if (version === sessionVersion) set({ error: (err as Error).message });
      throw err;
    }
  },

  signUp: async (name, email, password, role) => {
    const version = ++sessionVersion;
    set({ error: null });
    try {
      const { user } = await authService.register({ name, email, password, role });
      if (version === sessionVersion) set({ user, status: "authenticated" });
    } catch (err) {
      if (version === sessionVersion) set({ error: (err as Error).message });
      throw err;
    }
  },

  signOut: async () => {
    const refreshToken = getRefreshToken();
    sessionVersion += 1;
    set({ user: null, status: "guest", error: null });
    try {
      await authService.logout(refreshToken);
    } finally {
      await clearTokens();
      set({ user: null, status: "guest", error: null });
    }
  },

  refreshProfile: async () => {
    const version = sessionVersion;
    if (get().status !== "authenticated") return;
    try {
      const user = await authService.fetchMe();
      if (version === sessionVersion && get().status === "authenticated") {
        set({ user, status: "authenticated" });
      }
    } catch {
      if (version === sessionVersion && get().status === "authenticated") {
        await clearTokens();
        set({ user: null, status: "guest" });
      }
    }
  },

  updateUser: async (name?: string, avatarUrl?: string | null) => {
    const updated = await authService.updateProfile({ name, avatarUrl });
    set({ user: updated });
    return updated;
  },
  };
});
