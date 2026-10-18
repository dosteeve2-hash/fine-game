import type { Family, SpaceType } from "../engine";

export const palette = {
  night: "#070e1f",
  gold: "#f0a832",
  ivory: "#f5f0e8",
  gain: "#3cc48e",
  loss: "#e2706b"
} as const;

export const playerColors = ["#f0a832", "#9fc2e0", "#5fc79f", "#d6977a"] as const;

export const familyColors: Record<Family, string> = {
  trade: "#c9a35c",
  agriculture: "#82a66f",
  real_estate: "#9b8bb4",
  transport: "#6d9cb6",
  energy: "#c58358",
  technology: "#b07f95"
};

export const spaceColors: Record<Exclude<SpaceType, "asset">, string> = {
  start: "#f0a832",
  event: "#d08a7c",
  opportunity: "#6fbf98",
  tax: "#a9b2c6",
  circle: "#9fc2e0",
  bank: "#e3be7a",
  rest: "#a9b2c6",
  audit: "#e2706b"
};

const cities: Record<string, string> = {
  trade_kampala: "Kampala",
  trade_accra: "Accra",
  agriculture_dakar: "Dakar",
  agriculture_lima: "Lima",
  real_estate_nairobi: "Nairobi",
  real_estate_izmir: "İzmir",
  transport_lagos: "Lagos",
  transport_mumbai: "Mumbai",
  energy_reykjavik: "Reykjavik",
  energy_merida: "Mérida",
  technology_tallinn: "Tallinn",
  technology_kigali: "Kigali",
  trade_medellin: "Medellín",
  agriculture_kananga: "Kananga",
  real_estate_tbilisi: "Tbilisi",
  transport_kyoto: "Kyoto",
  energy_windhoek: "Windhoek",
  technology_toronto: "Toronto",
  trade_sarajevo: "Sarajevo",
  agriculture_antananarivo: "Antananarivo",
  real_estate_porto: "Porto",
  transport_santiago: "Santiago",
  energy_oslo: "Oslo",
  technology_seoul: "Seoul"
};

export function cityName(assetId: string): string {
  return cities[assetId] ?? assetId;
}

export function withAlpha(hex: string, alpha: number): string {
  const value = Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, "0");
  return `${hex}${value}`;
}

export function accentFor(space: { type: SpaceType; family?: Family }): string {
  if (space.type === "asset" && space.family) return familyColors[space.family];
  return spaceColors[space.type as Exclude<SpaceType, "asset">] ?? "#a9b2c6";
}
