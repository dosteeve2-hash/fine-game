import type { Family, SpaceType } from "../engine";

export const playerColors = ["#f0a832", "#2dd4ff", "#22d98a", "#a78bfa"] as const;

export const familyColors: Record<Family, string> = {
  trade: "#f0a832",
  agriculture: "#22d98a",
  real_estate: "#a78bfa",
  transport: "#2dd4ff",
  energy: "#f97316",
  technology: "#ec4899"
};

export const familyGlyphs: Record<Family, string> = {
  trade: "🛒",
  agriculture: "🌾",
  real_estate: "🏢",
  transport: "🚚",
  energy: "⚡",
  technology: "💻"
};

export const spaceGlyphs: Record<Exclude<SpaceType, "asset">, string> = {
  start: "★",
  event: "!",
  opportunity: "?",
  tax: "%",
  circle: "◎",
  bank: "$",
  rest: "☾"
};

export const spaceColors: Record<Exclude<SpaceType, "asset">, string> = {
  start: "#f0a832",
  event: "#ef4444",
  opportunity: "#22d98a",
  tax: "#9ba8c4",
  circle: "#2dd4ff",
  bank: "#c07d10",
  rest: "#4e5f82"
};

export function tileCell(index: number): { col: number; row: number } {
  if (index <= 10) return { col: 10 - index, row: 10 };
  if (index <= 20) return { col: 0, row: 20 - index };
  if (index <= 30) return { col: index - 20, row: 0 };
  return { col: 10, row: index - 30 };
}
