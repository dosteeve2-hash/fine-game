import type { Family, SpaceType } from "../engine";

export const playerColors = ["#f0a832", "#2dd4ff", "#22d98a", "#c4a1ff"] as const;

export const familyColors: Record<Family, string> = {
  trade: "#f0a832",
  agriculture: "#22d98a",
  real_estate: "#a78bfa",
  transport: "#2dd4ff",
  energy: "#f97316",
  technology: "#ec4899"
};

export const spaceColors: Record<Exclude<SpaceType, "asset">, string> = {
  start: "#f0a832",
  event: "#f87171",
  opportunity: "#22d98a",
  tax: "#9ba8c4",
  circle: "#2dd4ff",
  bank: "#f7c060",
  rest: "#8ea0c8"
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
  return spaceColors[space.type as Exclude<SpaceType, "asset">] ?? "#9ba8c4";
}
