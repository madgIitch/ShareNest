export const colors = {
  // Brand
  primary: "#1f63f1",
  primaryLight: "#e8f0fe",
  primaryDark: "#1449c4",

  // Semantic
  success: "#16a34a",
  successLight: "#dcfce7",
  error: "#dc2626",
  errorLight: "#fee2e2",
  warning: "#d97706",
  warningLight: "#fef3c7",

  // Neutrals
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",

  // Surfaces
  background: "#f4f6fa",
  surface: "#ffffff",
  border: "#e6e9ef",

  // Text
  text: "#111827",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",

  // Misc
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
} as const;

export type Color = keyof typeof colors;
