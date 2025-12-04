/**
 * Centralized Color System
 * 
 * This is the single source of truth for all colors in the application.
 * All colors should be imported from this file instead of being hardcoded.
 * 
 * Colors are organized by:
 * - Primary: Brand colors (green scale)
 * - Neutral: Gray scale
 * - Semantic: Purpose-driven colors (success, error, warning, etc.)
 * - Gradients: Pre-defined gradient combinations
 * - Charts: Chart-specific colors
 * - External: External service brand colors
 */

/**
 * Primary Brand Colors (Green Scale)
 */
export const primary = {
  900: "#16161B", // Primary darkest (black)
  800: "#16161B", // Primary dark
  700: "#16161B", // Primary dark
  600: "#7BC85A", // Primary medium green
  500: "#94DD78", // Primary green (base)
  400: "#B0E89A", // Primary light green
  300: "#C5F0B0", // Primary lighter green
} as const;

/**
 * Neutral Colors (Gray Scale)
 */
export const neutral = {
  50: "#FFFFFF",  // White
  100: "#DDDDDD", // Light gray
  200: "#DDDDDD", // Light gray
  300: "#9ca3af", // Medium gray
  400: "#374151", // Dark gray
  500: "#16161B", // Very dark gray (black)
  600: "#1d1d1f", // Dark mode background variant
} as const;

/**
 * Border Colors (Semantic)
 */
export const border = {
  default: "hsla(235, 15%, 45%, 0.14)", // Default border color with opacity
} as const;

/**
 * Semantic Colors (Purpose-driven)
 */
export const semantic = {
  success: {
    500: "#10b981",
    400: "#22c55e",
    300: "#34d399",
    200: "#6ee7b7",
    600: "#4ade80",
    700: "#14b8a6",
  },
  error: {
    500: "#ef4444",
    400: "#f87171",
    300: "#fca5a5",
    600: "#f43f5e",
  },
  warning: {
    500: "#f59e0b",
    400: "#eab308",
    600: "#fb923c",
  },
  info: {
    500: "#3b82f6",
    400: "#0ea5e9",
    600: "#6366f1",
  },
} as const;

/**
 * Gradient Color Combinations
 */
export const gradients = {
  landing: {
    dark: {
      start: "#16161B",
      mid: "#7BC85A",
      end: "#16161B",
    },
    light: {
      start: "#94DD78",
      end: "#B0E89A",
    },
  },
  hero: {
    light: {
      start: "#94DD78",
      mid: "#B0E89A",
      end: "#C5F0B0",
    },
    dark: {
      start: "#16161B",
      mid: "#7BC85A",
      end: "#94DD78",
    },
  },
} as const;

/**
 * Chart-specific Colors
 */
export const charts = {
  blue: "#8884d8",
  income: {
    primary: "#34d399",
    light: "#6ee7b7",
  },
  expenses: {
    primary: "#f87171",
    light: "#fca5a5",
  },
  assets: "#22c55e",
  debts: "#ef4444",
  healthScore: {
    start: "#ef4444", // red
    mid: "#fb923c",   // amber
    end: "#22c55e",   // green
  },
} as const;

/**
 * External Service Brand Colors
 */
export const external = {
  google: {
    blue: "#4285F4",
    green: "#34A853",
    yellow: "#FBBC05",
    red: "#EA4335",
  },
} as const;

/**
 * Helper function to convert hex to RGB for use in rgba() or shadow colors
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Helper function to get rgba string from hex color
 */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * All colors exported as a single object for convenience
 */
export const colors = {
  primary,
  neutral,
  border,
  semantic,
  gradients,
  charts,
  external,
} as const;

/**
 * Type exports for TypeScript
 */
export type PrimaryColor = typeof primary[keyof typeof primary];
export type NeutralColor = typeof neutral[keyof typeof neutral];
export type SemanticColor = typeof semantic;
export type GradientColor = typeof gradients;

