import { Building2, Cpu, Store, Truck, Wheat, Zap, type LucideIcon } from "lucide-react";
import type { BoardSpace, Family } from "../engine";
import { ArtIcon, spaceArt } from "./art";

export const iconStroke = 1.75;

export const familyIcons: Record<Family, LucideIcon> = {
  trade: Store,
  agriculture: Wheat,
  real_estate: Building2,
  transport: Truck,
  energy: Zap,
  technology: Cpu
};

interface SpaceIconProps {
  space: BoardSpace;
  size: number;
  color?: string;
  badge?: boolean;
}

export function SpaceIcon({ space, size, color, badge = false }: SpaceIconProps) {
  if (space.type === "asset" && space.family) {
    const Icon = familyIcons[space.family];
    return <Icon strokeWidth={iconStroke} aria-hidden size={size} color={color} />;
  }
  const picture = spaceArt(space);
  if (!picture) return null;
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }} aria-hidden>
      <ArtIcon name={picture.main} size={size} color={color} />
      {badge && picture.badge && (
        <span className="absolute -bottom-[12%] -right-[18%] flex items-center justify-center rounded-full bg-bg/90 ring-1 ring-line2" style={{ width: size * 0.55, height: size * 0.55 }}>
          <ArtIcon name={picture.badge} size={size * 0.38} color="#d9dfeb" />
        </span>
      )}
    </span>
  );
}
