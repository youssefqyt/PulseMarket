import { create } from "zustand";
import * as cartService from "../services/cart.service";
import type { Cart } from "../types";

interface CartState {
  cart: Cart;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (productId: number, quantity?: number) => Promise<void>;
  update: (productId: number, quantity: number) => Promise<void>;
  remove: (productId: number) => Promise<void>;
  clear: () => Promise<void>;
  reset: () => void;
}

const EMPTY: Cart = { items: [], total: 0, itemCount: 0 };

export const useCartStore = create<CartState>((set) => ({
  cart: EMPTY,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const cart = await cartService.fetchCart();
      set({ cart, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  add: async (productId, quantity = 1) => {
    const cart = await cartService.addToCart(productId, quantity);
    set({ cart });
  },

  update: async (productId, quantity) => {
    const cart = await cartService.updateCartItem(productId, quantity);
    set({ cart });
  },

  remove: async (productId) => {
    const cart = await cartService.removeCartItem(productId);
    set({ cart });
  },

  clear: async () => {
    const cart = await cartService.clearCart();
    set({ cart });
  },

  reset: () => set({ cart: EMPTY, loading: false, error: null }),
}));
