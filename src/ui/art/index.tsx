import type { CSSProperties } from "react";
import type { BoardSpace } from "../../engine";
import { art, type ArtName } from "./icons.generated";

export { art, gameIconAuthors, type ArtName } from "./icons.generated";

export function isMono(name: ArtName): boolean {
  return name.startsWith("game-icons:") || name.startsWith("mdi:");
}

interface ArtIconProps {
  name: ArtName;
  size: number;
  color?: string;
  fill?: string;
  className?: string;
  style?: CSSProperties;
}

export function ArtIcon({ name, size, color, fill, className, style }: ArtIconProps) {
  const icon = art[name];
  const body = fill ? icon.body.replaceAll('fill="currentColor"', `fill="${fill}"`) : icon.body;
  return (
    <svg
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className={className}
      style={{ color, flexShrink: 0, ...(isMono(name) ? {} : { filter: "saturate(0.72) contrast(0.96)" }), ...style }}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

export interface SpaceArt {
  main: ArtName;
  badge?: ArtName;
}

export function spaceArt(space: BoardSpace): SpaceArt | null {
  if (space.office) return { main: "game-icons:gavel", badge: "game-icons:park-bench" };
  switch (space.type) {
    case "start":
      return { main: "game-icons:cash", badge: "noto:sunrise" };
    case "bank":
      return { main: "noto:bank" };
    case "tax":
      return { main: "noto:balance-scale" };
    case "audit":
      return { main: "game-icons:magnifying-glass", badge: "game-icons:gavel" };
    case "rest":
      return { main: "game-icons:park-bench" };
    case "circle":
      return { main: "fluent-emoji-flat:handshake" };
    case "event":
      return { main: "game-icons:card-random" };
    case "opportunity":
      return { main: "game-icons:open-treasure-chest" };
    default:
      return null;
  }
}
