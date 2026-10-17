"use client";

import { motion } from "framer-motion";
import { playerSummary } from "../../engine";
import type { GameState } from "../../engine";
import { useI18n } from "../i18n";
import { playerColors } from "../theme";

interface Props {
  state: GameState;
  names: string[];
}

export function PlayerStrip({ state, names }: Props) {
  const { t, money } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="list">
      {state.players.map((player, index) => {
        const summary = playerSummary(state, player.id);
        const goal = Math.max(summary.expenses, summary.freedomTarget, 1);
        const progress = Math.min(1, summary.income / goal);
        const active = index === state.currentPlayerIndex && state.phase !== "finished";
        return (
          <motion.div
            key={player.id}
            role="listitem"
            layout
            className={`rounded-xl border bg-bg3 p-2.5 ${active ? "border-gold shadow-[0_0_0_1px_var(--color-gold)]" : "border-line2"}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: playerColors[index] }} />
              <span className="truncate text-sm font-medium">{names[index]}</span>
              {player.isBot && <span className="ml-auto font-mono text-[10px] text-text3">BOT {player.botLevel}</span>}
            </div>
            <div className="mt-1.5 font-mono text-base font-semibold text-gold2">{money(player.cash)}</div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-text2">
              <span>
                +{summary.income} / −{summary.expenses}
              </span>
              <span>{t("game.assets")} {player.assets.length}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-label={t("game.freedom")}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: playerColors[index] }}
                initial={false}
                animate={{ width: `${Math.round(progress * 100)}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 20 }}
              />
            </div>
            {summary.debt > 0 && <div className="mt-1 font-mono text-[10px] text-red">{t("game.debt")} {money(summary.debt)}</div>}
          </motion.div>
        );
      })}
    </div>
  );
}
