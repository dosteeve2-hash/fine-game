"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { GameEvent, GameState } from "../../engine";
import { useI18n } from "../i18n";
import type { MessageKey } from "../messages/fr";
import type { LogEntry } from "../useGame";

interface Props {
  state: GameState;
  names: string[];
  log: LogEntry[];
}

function cardText(d: (key: string) => string, id: string, part: "title" | "text"): string {
  const event = d(`card.${id}.${part}`);
  return event !== `card.${id}.${part}` ? event : d(`opportunity.${id}.${part}`);
}

export function useEventText(state: GameState, names: string[]) {
  const { t, d, money } = useI18n();

  return (event: GameEvent): string | null => {
    const key = `ev.${event.type}` as MessageKey;
    const nameIndex = state.players.findIndex(player => player.id === event.playerId);
    const space = event.assetId ? state.spaces.find(item => item.assetId === event.assetId) : undefined;
    const params = {
      name: nameIndex >= 0 ? names[nameIndex] ?? "" : "",
      amount: money(Math.abs(event.amount ?? 0)),
      n: event.amount ?? 0,
      asset: space ? d(space.titleKey) : "",
      card: event.cardKey ? cardText(d, event.cardKey, "title") : ""
    };
    try {
      return t(key, params);
    } catch {
      return null;
    }
  };
}

const hiddenTypes = new Set(["space.landed", "turn.income", "turn.expenses"]);

export function LogFeed({ state, names, log }: Props) {
  const { t } = useI18n();
  const text = useEventText(state, names);
  const shown = log.filter(entry => !hiddenTypes.has(entry.event.type)).slice(-8).reverse();

  return (
    <section aria-label={t("game.log")}>
      <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text3">{t("game.log")}</h3>
      <ul className="max-h-40 space-y-1 overflow-y-auto pr-1 text-xs text-text2">
        <AnimatePresence initial={false}>
          {shown.map(entry => {
            const line = text(entry.event);
            return line ? (
              <motion.li key={entry.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {line}
              </motion.li>
            ) : null;
          })}
        </AnimatePresence>
      </ul>
    </section>
  );
}

export function CardToast({ state, names, log }: Props) {
  const { d, money } = useI18n();
  const [shownId, setShownId] = useState<number | null>(null);
  const latest = [...log].reverse().find(entry => entry.event.type === "card.resolved");

  useEffect(() => {
    if (!latest) return;
    setShownId(latest.id);
    const timer = window.setTimeout(() => setShownId(null), 3200);
    return () => window.clearTimeout(timer);
  }, [latest?.id]);

  const visible = latest && shownId === latest.id ? latest : null;
  const event = visible?.event;
  const playerIndex = event ? state.players.findIndex(player => player.id === event.playerId) : -1;
  const amount = event?.amount ?? 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-30 flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {visible && event?.cardKey && (
          <motion.div
            key={visible.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-sm rounded-2xl border border-gold bg-bg2 p-4 shadow-2xl"
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-text3">{names[playerIndex]}</div>
            <div className="font-serif text-xl italic font-bold text-gold2">{cardText(d, event.cardKey, "title")}</div>
            <p className="mt-1 text-sm text-text2">{cardText(d, event.cardKey, "text")}</p>
            {amount !== 0 && (
              <div className={`mt-2 font-mono text-base font-semibold ${amount > 0 ? "text-green" : "text-red"}`}>
                {amount > 0 ? "+" : "−"}
                {money(Math.abs(amount))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
