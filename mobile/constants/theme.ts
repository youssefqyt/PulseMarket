// ------------------------------------------------------------------
//  Design tokens - a single source of truth for colours, spacing, type.
//  Purple-forward, modern marketplace look.
// ------------------------------------------------------------------

export const colors = {
  primary: "#6C5CE7",
  primaryDark: "#5A4BD1",
  primarySoft: "#EFECFE",
  accent: "#FD79A8",

  background: "#F5F6FB",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F1F8",

  text: "#1A1A2E",
  textMuted: "#8A8AA3",
  border: "#E7E8F0",

  success: "#00B894",
  warning: "#FDCB6E",
  danger: "#FF6B6B",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 30, fontWeight: "800" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  h3: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, fontWeight: "600" as const },
  small: { fontSize: 13, fontWeight: "400" as const },
  tiny: { fontSize: 11, fontWeight: "600" as const },
} as const;

export const shadow = {
  card: {
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  soft: {
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

/** Format a number as currency. */
export function formatPrice(value: number): string {
  return `$${Number(value).toFixed(2)}`;
}
