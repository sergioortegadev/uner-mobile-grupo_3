/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const coloresOficiales = {
  primario: "#2373F4",
  primarioPresionado: "#1D5FCC",
  secundario: "#578EF5",
  terciario: "#65D0F4",
  accion: "#F2A900",
  fontoSplash: "#FF9117",
  rioSuave: "#DCEEF1",
  tinta: "#16262D",
  textoSuave: "#52646C",
  niebla: "#F3F6F7",
  superficie: "#FFFFFF",
  borde: "#D3DCE0",

  // Estados de reportes
  recibido: "#64748B",
  enRevision: "#8E5BD0",
  asignado: "#C4520F",
  resuelto: "#237A48",
  rechazado: "#C23B3B",
} as const;

export const Colors = {
  light: {
    text: coloresOficiales.tinta,
    textSecondary: coloresOficiales.textoSuave,
    background: coloresOficiales.niebla,
    backgroundElement: coloresOficiales.superficie,
    backgroundSelected: coloresOficiales.rioSuave,
    border: coloresOficiales.borde,
    primary: coloresOficiales.primario,
    primaryPressed: coloresOficiales.primarioPresionado,
    action: coloresOficiales.accion,
    danger: coloresOficiales.rechazado,
  },
  dark: {
    text: "#F3F6F7",
    textSecondary: "#A0AEC0",
    background: "#0F172A",
    backgroundElement: "#1E293B",
    backgroundSelected: "#334155",
    border: "#334155",
    primary: coloresOficiales.primario,
    primaryPressed: coloresOficiales.primarioPresionado,
    action: coloresOficiales.accion,
    danger: coloresOficiales.rechazado,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
