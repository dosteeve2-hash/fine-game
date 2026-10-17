"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GameState } from "../../engine";
import { SpaceIcon } from "../icons";
import { accentFor, playerColors, withAlpha } from "../theme";
import { useText } from "../text";
import type { MessageKey } from "../messages/fr";
import { PawnShape } from "./Pawn";

interface Props {
  state: GameState;
  names: string[];
  index: number;
  compact?: boolean;
}

export function SpaceDetails({ state, names, index, compact = false }: Props) {
  const { t, d, money, number } = useText();
  const space = state.spaces[index];
  if (!space) return null;
  const accent = accentFor(space);

  if (space.type !== "asset" || !space.assetId || !space.family) {
    const info = t(`space.info.${space.type}` as MessageKey, { amount: money(space.amount ?? 0) });
    return (
      <div className="overflow-hidden rounded-2xl border border-line2 bg-bg3" style={{ boxShadow: `inset 0 3px 0 ${accent}` }}>
        <div className={compact ? "flex items-start gap-3 p-3" : "flex items-start gap-3 p-4"}>
          <span className="flex shrink-0 items-center justify-center rounded-xl" style={{ width: compact ? 36 : 44, height: compact ? 36 : 44, background: withAlpha(accent, 0.14) }}>
            <SpaceIcon space={space} size={compact ? 20 : 24} color={accent} />
          </span>
          <div className="min-w-0">
            <div className="font-serif text-lg font-bold italic leading-tight">{d(space.titleKey)}</div>
            <p className={`mt-1 leading-snug text-text2 ${compact ? "text-xs" : "text-sm"}`}>{info}</p>
          </div>
        </div>
      </div>
    );
  }

  const owned = state.ownedAssets.find(asset => asset.assetId === space.assetId);
  const ownerIndex = owned ? state.players.findIndex(player => player.id === owned.ownerId) : -1;
  const income = space.baseIncome ?? 0;
  const rent = space.rent ?? 0;
  const costs = space.upgradeCosts ?? [0, 0];
  const market = state.marketEffects.find(effect => effect.family === space.family);
  const level = owned?.level ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-line2 bg-[#f5f0e8] text-[#111d34] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)]" style={{ perspective: 900 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${space.assetId}-${ownerIndex}`}
          initial={{ rotateY: -90, opacity: 0.4 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 90, opacity: 0.4 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2 px-3 py-2" style={{ background: accent }}>
            <SpaceIcon space={space} size={compact ? 16 : 18} color="#0c1528" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0c1528]">{t(`family.${space.family}` as MessageKey)}</span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-[#0c1528]/70">{t("deed.title")}</span>
          </div>
          <div className={compact ? "px-3 pb-3 pt-2" : "px-4 pb-4 pt-3"}>
            <div className={`text-center font-serif font-black italic leading-tight ${compact ? "text-base" : "text-xl"}`}>{d(space.titleKey)}</div>
            <div className="mt-1 text-center font-mono text-xs text-[#4e5f82]">
              {t("deed.price")} · <span className="font-semibold text-[#111d34]">{money(space.price ?? 0)}</span>
            </div>
            <table className={`mt-2 w-full font-mono ${compact ? "text-[11px]" : "text-xs"}`}>
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[#4e5f82]">
                  <th className="pb-1 text-left font-normal" />
                  <th className="pb-1 text-right font-normal">{t("deed.income")}</th>
                  <th className="pb-1 text-right font-normal">{t("game.rent")}</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(row => (
                  <tr key={row} className={row === level ? "font-semibold" : ""} style={row === level && ownerIndex >= 0 ? { background: withAlpha(playerColors[ownerIndex] ?? "#f0a832", 0.28) } : undefined}>
                    <td className="py-0.5 pl-1 text-left">{t("deed.level", { level: row })}</td>
                    <td className="py-0.5 text-right text-[#0b7a4b]">+{number(income * row)}</td>
                    <td className="py-0.5 pr-1 text-right">{number(rent * row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 flex justify-between border-t border-[#111d34]/10 pt-2 font-mono text-[11px]">
              <span className="text-[#4e5f82]">{t("deed.upgrades")}</span>
              <span>
                {t("deed.level", { level: 2 })} {money(costs[0])} · {t("deed.level", { level: 3 })} {money(costs[1])}
              </span>
            </div>
            {!compact && <p className="mt-2 text-[11px] leading-snug text-[#4e5f82]">{t("deed.familyBonus", { pct: Math.round(state.config.familyBonus * 100) })}</p>}
            {market && <p className="mt-1 text-[11px] font-medium text-[#b45309]">{t("deed.market", { mult: number(market.multiplier), turns: market.turnsRemaining })}</p>}
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#111d34]/5 px-2 py-1.5 text-xs">
              {ownerIndex >= 0 ? (
                <>
                  <PawnShape index={ownerIndex} size={13} />
                  <span>{t("deed.owner", { name: names[ownerIndex] ?? "" })}</span>
                  <span className="ml-auto font-mono text-[11px]">{t("deed.level", { level })}</span>
                </>
              ) : (
                <span className="text-[#4e5f82]">{t("deed.free")}</span>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
