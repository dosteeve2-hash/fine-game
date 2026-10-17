"use client";

import type { ReactNode } from "react";

import { motion } from "framer-motion";
import type { GameState } from "../../engine";
import { familyColors, familyGlyphs, playerColors, spaceColors, spaceGlyphs, tileCell } from "../theme";

const cell = 32;
const pad = 4;
const size = cell * 11 + pad * 2;

interface Props {
  state: GameState;
  children?: ReactNode;
}

export function BoardMap({ state, children }: Props) {
  const ownerIndex = new Map(state.ownedAssets.map(asset => [asset.assetId, state.players.findIndex(player => player.id === asset.ownerId)]));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" role="img" aria-label="Board">
        {state.spaces.map((space, index) => {
          const { col, row } = tileCell(index);
          const x = pad + col * cell;
          const y = pad + row * cell;
          const owner = space.assetId ? ownerIndex.get(space.assetId) ?? -1 : -1;
          const accent = space.type === "asset" && space.family ? familyColors[space.family] : spaceColors[space.type as keyof typeof spaceColors];
          const glyph = space.type === "asset" && space.family ? familyGlyphs[space.family] : spaceGlyphs[space.type as keyof typeof spaceGlyphs];
          const level = space.assetId ? state.ownedAssets.find(asset => asset.assetId === space.assetId)?.level ?? 0 : 0;
          return (
            <g key={index}>
              <rect
                x={x + 1}
                y={y + 1}
                width={cell - 2}
                height={cell - 2}
                rx={5}
                fill="#111d34"
                stroke={owner >= 0 ? playerColors[owner] : "#1f3054"}
                strokeWidth={owner >= 0 ? 2 : 1}
              />
              <rect x={x + 3} y={y + 3} width={cell - 6} height={3} rx={1.5} fill={accent} opacity={0.9} />
              <text x={x + cell / 2} y={y + cell / 2 + 6} textAnchor="middle" fontSize={space.type === "asset" ? 13 : 14} fill={accent} fontFamily="var(--font-mono)" fontWeight={600}>
                {glyph}
              </text>
              {level > 1 && (
                <text x={x + cell - 5} y={y + cell - 5} textAnchor="end" fontSize={7} fill="#f5f0e8" fontFamily="var(--font-mono)" fontWeight={600}>
                  {"▮".repeat(level)}
                </text>
              )}
            </g>
          );
        })}
        {state.players.map((player, playerIndex) => {
          const { col, row } = tileCell(player.position);
          const offset = [
            [-7, -7],
            [7, -7],
            [-7, 7],
            [7, 7]
          ][playerIndex] ?? [0, 0];
          const cx = pad + col * cell + cell / 2 + (offset[0] ?? 0);
          const cy = pad + row * cell + cell / 2 + (offset[1] ?? 0);
          const active = playerIndex === state.currentPlayerIndex;
          return (
            <motion.circle
              key={player.id}
              initial={false}
              animate={{ cx, cy, r: active ? 6 : 5 }}
              transition={{ type: "spring", stiffness: 140, damping: 18 }}
              fill={playerColors[playerIndex]}
              stroke="#070e1f"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>
      <div className="absolute inset-[11.2%] flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
