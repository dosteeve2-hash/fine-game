"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { art, isMono } from "../art";
import { pawnDef } from "../art/pawns";
import { playerColors } from "../theme";

const PawnsContext = createContext<readonly string[]>([]);

export function PawnsProvider({ pawns, children }: { pawns: readonly string[]; children: ReactNode }) {
  return <PawnsContext.Provider value={pawns}>{children}</PawnsContext.Provider>;
}

export function usePawns(): readonly string[] {
  return useContext(PawnsContext);
}

function mix(hex: string, target: number, amount: number): string {
  const value = Number.parseInt(hex.slice(1, 7), 16);
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * (1 - amount) + target * amount);
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

interface Props {
  index: number;
  size?: number;
  active?: boolean;
  pawn?: string;
  color?: string;
}

export function PawnShape({ index, size = 28, active = false, pawn, color: forced }: Props) {
  const chosen = usePawns();
  const id = useId().replace(/:/g, "");
  const color = forced ?? playerColors[index % playerColors.length] ?? "#f0a832";
  const def = pawnDef(pawn ?? chosen[index], index);
  const icon = art[def.art];
  const mono = isMono(def.art);
  const body = mono
    ? icon.body.replaceAll('fill="currentColor"', `fill="url(#metal-${id})" stroke="#0a1222" stroke-width="${icon.width * 0.035}" stroke-linejoin="round" paint-order="stroke"`)
    : icon.body;

  return (
    <svg viewBox="0 0 24 30" width={size} height={size * 1.25} aria-hidden focusable="false" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`metal-${id}`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={mix(color, 255, 0.72)} />
          <stop offset="38%" stopColor={color} />
          <stop offset="72%" stopColor={mix(color, 0, 0.32)} />
          <stop offset="100%" stopColor={mix(color, 255, 0.25)} />
        </linearGradient>
        <linearGradient id={`base-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mix(color, 255, 0.45)} />
          <stop offset="55%" stopColor={mix(color, 0, 0.18)} />
          <stop offset="100%" stopColor={mix(color, 0, 0.55)} />
        </linearGradient>
      </defs>
      <ellipse cx={12} cy={28.6} rx={10} ry={1.9} fill="#000" opacity={0.5} />
      {active && <ellipse cx={12} cy={27.4} rx={11.8} ry={3.2} fill="none" stroke="#f7c060" strokeWidth={1.1} opacity={0.95} />}
      <path d="M3.2 26.6c0-1.6 3.9-2.8 8.8-2.8s8.8 1.2 8.8 2.8v.6c0 1.5-3.9 2.6-8.8 2.6s-8.8-1.1-8.8-2.6z" fill={`url(#base-${id})`} stroke="#0a1222" strokeWidth={0.6} />
      <ellipse cx={12} cy={26.5} rx={8.4} ry={2.3} fill={mix(color, 255, 0.3)} opacity={0.55} />
      <svg x={1.2} y={2.2} width={21.6} height={22.6} viewBox={`0 0 ${icon.width} ${icon.height}`} overflow="visible" dangerouslySetInnerHTML={{ __html: body }} />
    </svg>
  );
}
