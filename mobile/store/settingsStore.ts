import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Currency = "USD" | "EUR" | "TND" | "GBP";
export type Language = "en" | "fr" | "ar";

interface SettingsState {
  currency: Currency;
  language: Language;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  biometricsEnabled: boolean;
  defaultAddress: string;
  phone: string;
  loaded: boolean;

  reset: () => Promise<void>;
  loadSettings: () => Promise<void>;
  setCurrency: (c: Currency) => Promise<void>;
  setLanguage: (l: Language) => Promise<void>;
  setPushNotifications: (enabled: boolean) => Promise<void>;
  setEmailNotifications: (enabled: boolean) => Promise<void>;
  setSmsNotifications: (enabled: boolean) => Promise<void>;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  setDefaultAddress: (addr: string) => Promise<void>;
  setPhone: (phone: string) => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const STORAGE_KEY = "@pulsemarket_settings";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  TND: "DT ",
  GBP: "£",
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: "USD",
  language: "en",
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  biometricsEnabled: false,
  defaultAddress: "12 Avenue Habib Bourguiba, Tunis",
  phone: "+216 20 123 456",
  loaded: false,

  reset: async () => {
    set({
      currency: "USD",
      language: "en",
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      biometricsEnabled: false,
      defaultAddress: "",
      phone: "",
      loaded: true,
    });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const { savedCards, ...settings } = parsed;
        set({ ...settings, loaded: true });
        if (savedCards) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  setCurrency: async (currency: Currency) => {
    set({ currency });
    const current = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
  },

  setLanguage: async (language: Language) => {
    set({ language });
    const current = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
  },

  setPushNotifications: async (pushNotifications: boolean) => {
    set({ pushNotifications });
    const current = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
  },

  setEmailNotifications: async (emailNotifications: boolean) => {
    set({ emailNotifications });
    const current = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
  },

  setSmsNotifications: async (smsNotifications: boolean) => {
    set({ smsNotifications });
    const current = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
  },

  setBiometricsEnabled: async (biometricsEnabled: boolean) => {
    set({ biometricsEnabled });
    const current = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
  },

  setDefaultAddress: async (defaultAddress: string) => {
    set({ defaultAddress });
    const current = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
  },

  setPhone: async (phone: string) => {
    set({ phone });
    const current = get();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current)).catch(() => {});
  },

  formatCurrency: (amount: number) => {
    const curr = get().currency;
    const sym = CURRENCY_SYMBOLS[curr] || "$";
    const formattedNum = Number(amount).toFixed(2);
    if (curr === "TND") {
      return `${formattedNum} ${sym.trim()}`;
    }
    return `${sym}${formattedNum}`;
  },
}));
