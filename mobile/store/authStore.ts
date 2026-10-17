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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  error: null,

  /** Called once on app start: restore tokens and fetch the current user. */
  initialize: async () => {
    await hydrateTokens();
    try {
      const user = await authService.fetchMe();
      set({ user, status: "authenticated" });
    } catch {
      await clearTokens();
      set({ user: null, status: "guest" });
    }
  },

  signIn: async (email, password) => {
    set({ error: null });
    try {
      const { user } = await authService.login({ email, password });
      set({ user, status: "authenticated" });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  signUp: async (name, email, password, role) => {
    set({ error: null });
    try {
      const { user } = await authService.register({ name, email, password, role });
      set({ user, status: "authenticated" });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  signOut: async () => {
    await authService.logout(getRefreshToken());
    set({ user: null, status: "guest", error: null });
  },

  refreshProfile: async () => {
    try {
      const user = await authService.fetchMe();
      set({ user, status: "authenticated" });
    } catch {
      await clearTokens();
      set({ user: null, status: "guest" });
    }
  },
}));
