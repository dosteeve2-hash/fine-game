"use client";

import { motion } from "framer-motion";
import { playerSummary } from "../../engine";
import type { GameState } from "../../engine";
import { useI18n } from "../i18n";
import { playerColors } from "../theme";

interface Props {
  state: GameState;
  names: string[];
  onReplay: () => void;
  onHome: () => void;
}

export function ResultScreen({ state, names, onReplay, onHome }: Props) {
  const { t, money } = useI18n();
  const winnerIndex = state.players.findIndex(player => player.id === state.winner);
  const winnerName = names[winnerIndex] ?? "";
  const ranking = state.players
    .map((player, index) => ({ index, worth: playerSummary(state, player.id).netWorth }))
    .sort((a, b) => b.worth - a.worth);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 12 }}>
        <div className="text-6xl" aria-hidden>🏆</div>
        <h1 className="mt-3 font-serif text-4xl italic font-black text-gold">{t("result.title")}</h1>
        <p className="mt-2 text-text2">
          {state.endReason === "freedom" ? t("result.freedom", { name: winnerName }) : t("result.turnLimit", { name: winnerName })}
        </p>
      </motion.div>

      <section className="w-full rounded-2xl border border-line2 bg-bg3 p-4" aria-label={t("result.stats")}>
        <h2 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text3">{t("result.stats")}</h2>
        <ol className="space-y-2">
          {ranking.map((row, position) => (
            <li key={row.index} className="flex items-center gap-2 text-sm">
              <span className="w-5 font-mono text-text3">{position + 1}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: playerColors[row.index] }} />
              <span className="flex-1 truncate text-left">{names[row.index]}</span>
              <span className="font-mono text-gold2">{money(row.worth)}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex w-full gap-2">
        <button type="button" onClick={onHome} className="min-h-12 flex-1 rounded-xl border border-line2 bg-bg3 text-sm">
          {t("result.home")}
        </button>
        <button type="button" onClick={onReplay} className="min-h-12 flex-1 rounded-xl bg-gold text-sm font-medium text-bg">
          {t("result.replay")}
        </button>
      </div>
    </main>
  );
}
