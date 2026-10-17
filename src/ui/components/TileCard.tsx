"use client";

import type { GameState } from "../../engine";
import { useI18n } from "../i18n";
import { familyColors, familyGlyphs, playerColors, spaceColors, spaceGlyphs } from "../theme";

interface Props {
  state: GameState;
  names: string[];
}

export function TileCard({ state, names }: Props) {
  const { t, d, money } = useI18n();
  const player = state.players[state.currentPlayerIndex];
  if (!player) return null;
  const space = state.spaces[player.position];
  if (!space) return null;
  const owned = space.assetId ? state.ownedAssets.find(asset => asset.assetId === space.assetId) : undefined;
  const ownerIndex = owned ? state.players.findIndex(item => item.id === owned.ownerId) : -1;
  const isAsset = space.type === "asset" && space.family;
  const accent = isAsset && space.family ? familyColors[space.family] : spaceColors[space.type as keyof typeof spaceColors];
  const glyph = isAsset && space.family ? familyGlyphs[space.family] : spaceGlyphs[space.type as keyof typeof spaceGlyphs];

  return (
    <div className="rounded-xl border border-line2 bg-bg3 p-3" style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>{glyph}</span>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-text3">{t("space.here")}</div>
          <div className="truncate font-serif text-lg italic font-bold leading-tight">{d(space.titleKey)}</div>
        </div>
      </div>
      {isAsset && (
        <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs">
          <div>
            <div className="text-text3">{t("game.price")}</div>
            <div className="text-text">{money(space.price ?? 0)}</div>
          </div>
          <div>
            <div className="text-text3">{t("game.income1")}</div>
            <div className="text-green">+{space.baseIncome ?? 0}</div>
          </div>
          <div>
            <div className="text-text3">{t("game.rent")}</div>
            <div className="text-text">{space.rent ?? 0}</div>
          </div>
          <div className="col-span-3 flex items-center gap-1.5 font-sans text-xs text-text2">
            {owned ? (
              <>
                <span className="h-2 w-2 rounded-full" style={{ background: playerColors[ownerIndex] }} />
                {t("game.owner")} : {names[ownerIndex]} · {t("game.level", { level: owned.level })}
              </>
            ) : (
              t("game.unowned")
            )}
          </div>
        </div>
      )}
    </div>
  );
}
