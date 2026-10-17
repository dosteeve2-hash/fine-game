"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Action, GameState } from "../../engine";
import { useI18n } from "../i18n";
import { playerColors } from "../theme";
import type { LogEntry } from "../useGame";
import { ActionPanel } from "./ActionPanel";
import { BoardMap } from "./BoardMap";
import { CardToast, LogFeed } from "./Feed";
import { PlayerStrip } from "./PlayerStrip";
import { TileCard } from "./TileCard";

interface Props {
  state: GameState;
  names: string[];
  log: LogEntry[];
  botTurn: boolean;
  onAct: (action: Action) => void;
  onLeave: () => void;
}

export function GameScreen({ state, names, log, botTurn, onAct, onLeave }: Props) {
  const { t, money } = useI18n();
  const [menu, setMenu] = useState(false);
  const index = state.currentPlayerIndex;
  const player = state.players[index];
  const lastRoll = [...log].reverse().find(entry => entry.event.type === "dice.rolled");
  const round = Math.floor(state.turn / state.players.length) + 1;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-3 px-3 pb-8 pt-3">
      <header className="flex items-center justify-between">
        <span className="font-serif text-2xl italic font-black text-gold">FINE</span>
        <span className="font-mono text-xs text-text3">{t("game.round", { n: round })}</span>
        <button type="button" onClick={() => setMenu(true)} className="min-h-10 rounded-lg border border-line2 px-3 text-xs text-text2">
          {t("game.menu")}
        </button>
      </header>

      <PlayerStrip state={state} names={names} />

      <BoardMap state={state}>
        <div className="font-mono text-[10px] uppercase tracking-wider text-text3">{t("game.turnOf", { name: names[index] ?? "" })}</div>
        <div className="mt-1 h-1 w-10 rounded-full" style={{ background: playerColors[index] }} />
        <AnimatePresence mode="popLayout">
          {lastRoll && (
            <motion.div
              key={lastRoll.id}
              initial={{ rotate: -200, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 14 }}
              className="mt-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold bg-bg2 font-mono text-2xl font-semibold text-gold2"
              aria-label={`${lastRoll.event.amount ?? ""}`}
            >
              {lastRoll.event.amount}
            </motion.div>
          )}
        </AnimatePresence>
        {state.circle && (
          <div className="mt-3 rounded-lg border border-cyan/40 px-2 py-1 font-mono text-[10px] text-cyan">
            {t("game.circle")} · {t("game.circlePot", { amount: money(state.circle.pot) })}
          </div>
        )}
      </BoardMap>

      <TileCard state={state} names={names} />

      <section className="rounded-xl border border-line2 bg-bg2 p-3">
        {botTurn ? (
          <p className="py-2 text-center text-sm text-text2" aria-live="polite">
            {t("game.botThinking", { name: player ? names[index] ?? "" : "" })}
          </p>
        ) : (
          <ActionPanel state={state} disabled={false} onAct={onAct} />
        )}
      </section>

      <LogFeed state={state} names={names} log={log} />
      <CardToast state={state} names={names} log={log} />

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={() => setMenu(false)}
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              exit={{ y: 30 }}
              onClick={event => event.stopPropagation()}
              className="w-full max-w-sm space-y-2 rounded-2xl border border-line2 bg-bg2 p-4"
              role="dialog"
              aria-modal="true"
            >
              <button type="button" onClick={onLeave} className="min-h-12 w-full rounded-xl border border-line2 bg-bg3 text-sm">
                {t("game.newGame")}
              </button>
              <button type="button" onClick={() => setMenu(false)} className="min-h-12 w-full rounded-xl bg-gold text-sm font-medium text-bg">
                {t("game.close")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
