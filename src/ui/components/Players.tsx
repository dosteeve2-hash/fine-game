"use client";

import { motion } from "framer-motion";
import { Bot, Landmark, ShieldCheck } from "lucide-react";
import { playerSummary } from "../../engine";
import type { GameState } from "../../engine";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";
import { playerColors, withAlpha } from "../theme";
import { CountUp, DeltaFloats } from "./Money";
import { PawnShape } from "./Pawn";

interface Props {
  state: GameState;
  names: string[];
  compact?: boolean;
}

export function Players({ state, names, compact = false }: Props) {
  const { t, money } = useI18n();

  return (
    <ul className={compact ? "grid gap-1.5" : "grid gap-2"} style={{ gridTemplateColumns: compact ? `repeat(${state.players.length}, minmax(0, 1fr))` : state.players.length > 2 ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)" }} aria-label={t("setup.players")}>
      {state.players.map((player, index) => {
        const summary = playerSummary(state, player.id);
        const goal = Math.max(summary.expenses, summary.freedomTarget, 1);
        const progress = Math.min(1, summary.income / goal);
        const active = index === state.currentPlayerIndex && state.phase !== "finished";
        const color = playerColors[index] ?? "#f0a832";
        return (
          <motion.li
            key={player.id}
            data-player-chip={index}
            layout
            className="relative rounded-xl border bg-bg3/90"
            style={{
              borderColor: active ? color : "#1f3054",
              boxShadow: active ? `0 0 0 1px ${color}, 0 8px 28px -10px ${withAlpha(color, 0.6)}` : "none"
            }}
            animate={{ scale: active ? 1 : 0.985, opacity: active || !compact ? 1 : 0.82 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <DeltaFloats value={player.cash} />
            {compact ? (
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <span className="shrink-0">
                  <PawnShape index={index} size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className="truncate text-[11px] font-medium leading-tight text-text">{names[index]}</span>
                    {player.isBot && <Bot size={11} strokeWidth={iconStroke} className="shrink-0 text-text3" aria-label={t("setup.bot")} />}
                  </span>
                  <CountUp value={player.cash} className={`block font-mono text-[12px] font-semibold leading-tight ${player.cash < 0 ? "text-red" : "text-gold2"}`} />
                </span>
              </div>
            ) : (
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <PawnShape index={index} size={20} active={active} />
                  <span className="truncate text-sm font-semibold">{names[index]}</span>
                  {player.isBot && (
                    <span className="ml-auto flex items-center gap-1 rounded-md border border-line2 px-1.5 py-0.5 font-mono text-[10px] text-text2">
                      <Bot size={11} strokeWidth={iconStroke} aria-hidden />
                      {player.botLevel}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <CountUp value={player.cash} className={`font-mono text-xl font-semibold leading-none ${player.cash < 0 ? "text-red" : "text-gold2"}`} />
                  <span className="flex items-center gap-1.5 text-text3">
                    {player.insurance.length > 0 && (
                      <span className="flex items-center gap-0.5 font-mono text-[10px]" title={t("game.section.insure")}>
                        <ShieldCheck size={12} strokeWidth={iconStroke} aria-hidden />
                        {player.insurance.length}
                      </span>
                    )}
                    {summary.debt > 0 && (
                      <span className="flex items-center gap-0.5 font-mono text-[10px] text-red" title={t("game.debt")}>
                        <Landmark size={12} strokeWidth={iconStroke} aria-hidden />
                        {money(summary.debt)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] text-text2">
                  <span className="text-green">+{summary.income}</span>
                  <span>{t("game.assets")} {player.assets.length}</span>
                  <span className="text-red">−{summary.expenses}</span>
                </div>
              </div>
            )}
            <div
              className={compact ? "mx-2 mb-1.5 h-[3px] overflow-hidden rounded-full bg-line" : "mx-3 mb-3 h-1.5 overflow-hidden rounded-full bg-line"}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={goal}
              aria-valuenow={summary.income}
              aria-label={t("game.freedomProgress", { income: summary.income, goal })}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={false}
                animate={{ width: `${Math.round(progress * 100)}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
              />
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
