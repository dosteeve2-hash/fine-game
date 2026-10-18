"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GameState } from "../../engine";
import type { LogEvent } from "../../engine/ledger";
import { playerColors } from "../theme";
import { useText } from "../text";
import type { LogEntry } from "../useGame";

const hidden = new Set(["space.landed", "turn.income", "turn.expenses"]);

function shown(event: LogEvent): boolean {
  if (hidden.has(event.type)) return false;
  if (event.type === "card.resolved") return true;
  return !event.type.startsWith("card.") && !event.type.startsWith("opportunity.");
}

export function LogFeed({ state, names, log, limit = 14, bare = false }: { state: GameState; names: string[]; log: LogEntry[]; limit?: number; bare?: boolean }) {
  const { t, eventText } = useText();
  const rows = log.filter(entry => shown(entry.event)).slice(-limit).reverse();

  return (
    <section aria-label={t("game.log")} className="flex h-full min-h-0 flex-col">
      {!bare && <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text3">{t("game.log")}</h3>}
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 text-[13px] text-text2">
        <AnimatePresence initial={false}>
          {rows.map(entry => {
            const line = eventText(entry.event, state, names);
            const index = state.players.findIndex(player => player.id === entry.event.playerId);
            return line ? (
              <motion.li key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex gap-2 leading-snug">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: playerColors[index] ?? "#4e5f82" }} />
                <span>{line}</span>
              </motion.li>
            ) : null;
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}
