"use client";

import type { GameState } from "../../engine";
import { useI18n } from "../i18n";
import { playerColors } from "../theme";
import { boardSize, pawnPoint, tileRect, type Orientation } from "./geometry";

interface Props {
  view: GameState;
  orientation: Orientation;
  /** Visible part of the board, in board units. */
  window: { x: number; y: number; w: number; h: number };
  width: number;
  onPress: () => void;
}

export function MiniMap({ view, orientation, window: frame, width, onPress }: Props) {
  const { t } = useI18n();
  const size = boardSize(orientation);
  const scale = width / size.width;
  const height = size.height * scale;
  const owners = new Map(view.ownedAssets.map(asset => [asset.assetId, view.players.findIndex(player => player.id === asset.ownerId)]));
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={t("camera.overview")}
      data-testid="minimap"
      className="rounded-xl border border-line2 bg-bg/80 p-1 shadow-lg backdrop-blur"
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
        {view.spaces.map((space, index) => {
          const rect = tileRect(index, orientation);
          const owner = space.assetId ? owners.get(space.assetId) ?? -1 : -1;
          return (
            <rect
              key={index}
              x={rect.x * scale + 0.4}
              y={rect.y * scale + 0.4}
              width={rect.w * scale - 0.8}
              height={rect.h * scale - 0.8}
              rx={1}
              fill={owner >= 0 ? playerColors[owner] ?? "#1f3054" : "#1c2b4a"}
              opacity={owner >= 0 ? 0.75 : 1}
            />
          );
        })}
        {view.players.map((player, index) => {
          const point = pawnPoint(player.position, index, orientation, scale, scale);
          return <circle key={player.id} cx={point.x} cy={point.y} r={Math.max(1.6, scale * 0.22)} fill={playerColors[index] ?? "#f0a832"} stroke="#070e1f" strokeWidth={0.6} />;
        })}
        <rect
          x={Math.max(0, frame.x * scale)}
          y={Math.max(0, frame.y * scale)}
          width={Math.min(width, frame.w * scale)}
          height={Math.min(height, frame.h * scale)}
          rx={2}
          fill="none"
          stroke="#f7c060"
          strokeWidth={1.2}
        />
      </svg>
    </button>
  );
}
