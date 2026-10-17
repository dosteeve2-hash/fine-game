import {
  Armchair,
  Building2,
  Cpu,
  HandCoins,
  Landmark,
  Receipt,
  Shuffle,
  Sparkles,
  Store,
  Truck,
  Wallet,
  Wheat,
  Zap,
  type LucideIcon,
  type LucideProps
} from "lucide-react";
import type { BoardSpace, Family, SpaceType } from "../engine";

export const iconStroke = 1.75;

export const familyIcons: Record<Family, LucideIcon> = {
  trade: Store,
  agriculture: Wheat,
  real_estate: Building2,
  transport: Truck,
  energy: Zap,
  technology: Cpu
};

export const spaceIcons: Record<Exclude<SpaceType, "asset">, LucideIcon> = {
  start: Wallet,
  bank: Landmark,
  circle: HandCoins,
  event: Shuffle,
  opportunity: Sparkles,
  tax: Receipt,
  rest: Armchair
};

export function iconFor(space: BoardSpace): LucideIcon {
  if (space.type === "asset" && space.family) return familyIcons[space.family];
  return spaceIcons[space.type as Exclude<SpaceType, "asset">] ?? Sparkles;
}

export function SpaceIcon({ space, ...props }: { space: BoardSpace } & LucideProps) {
  const Icon = iconFor(space);
  return <Icon strokeWidth={iconStroke} aria-hidden {...props} />;
}
