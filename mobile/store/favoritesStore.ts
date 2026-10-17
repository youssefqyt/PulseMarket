import { create } from "zustand";
import * as favoriteService from "../services/favorite.service";

interface FavoritesState {
  ids: Set<number>;
  load: () => Promise<void>;
  toggle: (productId: number) => Promise<void>;
  isFavorite: (productId: number) => boolean;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set<number>(),

  load: async () => {
    try {
      const result = await favoriteService.fetchFavorites();
      set({ ids: new Set(result.items.map((p) => p.id)) });
    } catch {
      /* user might not be signed in - ignore */
    }
  },

  toggle: async (productId) => {
    const current = get().ids.has(productId);
    // Optimistic update.
    const next = new Set(get().ids);
    if (current) next.delete(productId);
    else next.add(productId);
    set({ ids: next });

    try {
      await favoriteService.toggleFavorite(productId, current);
    } catch {
      // Roll back on failure.
      set({ ids: get().ids });
    }
  },

  isFavorite: (productId) => get().ids.has(productId),

  reset: () => set({ ids: new Set<number>() }),
}));
