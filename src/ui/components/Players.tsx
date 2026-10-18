"use client";

import { motion } from "framer-motion";
import { Bot, CircleHelp, Gavel, Landmark, ShieldCheck } from "lucide-react";
import { playerSummary } from "../../engine";
import type { GameState } from "../../engine";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";
import { playerColors, withAlpha } from "../theme";
import type { MoveRecord } from "../useGame";
import { CountUp, DeltaFloats } from "./Money";
import { PawnShape } from "./Pawn";

interface Props {
  state: GameState;
  names: string[];
  ledger: MoveRecord[];
  onHistory: (index: number) => void;
  onGuide?: (index: number) => void;
  compact?: boolean;
}

export function Players({ state, names, ledger, onHistory, onGuide, compact = false }: Props) {
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
              borderColor: active ? "#f0a832" : "#1f3054",
              boxShadow: active ? `0 0 0 1px #f0a832, 0 0 26px -6px ${withAlpha("#f0a832", 0.75)}, inset 3px 0 0 ${color}` : `inset 3px 0 0 ${withAlpha(color, 0.7)}`
            }}
            animate={{ scale: active ? 1 : 0.985, opacity: active || !compact ? 1 : 0.82 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <DeltaFloats
              moves={ledger.filter(move => move.playerId === player.id)}
              state={state}
              names={names}
              align={compact ? (index === 0 ? "start" : index === state.players.length - 1 ? "end" : "center") : "center"}
            />
            {compact ? (
              <button
                type="button"
                onClick={() => onHistory(index)}
                aria-label={t("history.open", { name: names[index] ?? "" })}
                className="flex w-full items-center gap-1.5 rounded-xl px-2 py-1.5 text-left"
              >
                <span className="shrink-0">
                  <PawnShape index={index} size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className="truncate text-[11px] font-medium leading-tight text-text">{names[index]}</span>
                    {player.isBot && <Bot size={11} strokeWidth={iconStroke} className="shrink-0 text-text3" aria-hidden />}
                    {player.auditTurns > 0 && <Gavel size={11} strokeWidth={iconStroke} className="shrink-0 text-red" aria-label={t("audit.heldYou", { n: player.auditTurns })} />}
                  </span>
                  <CountUp value={player.cash} className={`block font-mono text-[12px] font-semibold leading-tight ${player.cash < 0 ? "text-red" : "text-gold2"}`} />
                </span>
              </button>
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
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onHistory(index)}
                      aria-label={t("history.open", { name: names[index] ?? "" })}
                      className="-m-1 rounded-lg p-1 text-left hover:bg-bg/60"
                    >
                      <CountUp value={player.cash} className={`whitespace-nowrap font-mono text-xl font-semibold leading-none ${player.cash < 0 ? "text-red" : "text-gold2"}`} />
                    </button>
                    {onGuide && (
                      <button
                        type="button"
                        onClick={() => onGuide(index)}
                        aria-label={t("guide.open", { name: names[index] ?? "" })}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-line2 text-text2 hover:border-gold hover:text-gold2"
                      >
                        <CircleHelp size={14} strokeWidth={iconStroke} aria-hidden />
                      </button>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 text-text3">
                    {player.auditTurns > 0 && (
                      <span className="flex items-center gap-0.5 font-mono text-[10px] text-red" title={t("audit.heldYou", { n: player.auditTurns })}>
                        <Gavel size={12} strokeWidth={iconStroke} aria-hidden />
                        {player.auditTurns}
                      </span>
                    )}
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
