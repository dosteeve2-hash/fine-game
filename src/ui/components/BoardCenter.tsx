"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HandCoins } from "lucide-react";
import type { GameState } from "../../engine";
import type { Orientation } from "../board/geometry";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";
import { playerColors, withAlpha } from "../theme";
import type { Stage } from "../useGame";
import { Dice } from "./Dice";
import { Fino } from "./Fino";
import { PawnShape } from "./Pawn";
import { SpaceDetails } from "./SpaceDetails";

interface Props {
  view: GameState;
  stage: Stage;
  names: string[];
  thinking: boolean;
  layout: { orientation: Orientation; unit: number; width: number; height: number };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function BoardCenter({ view, stage, names, thinking, layout }: Props) {
  const { t, money } = useI18n();
  const current = view.currentPlayerIndex;
  const player = view.players[current];
  const color = playerColors[current] ?? "#f0a832";
  const landscape = layout.orientation === "landscape";
  const finoSize = clamp(Math.min(layout.width, layout.height) * (landscape ? 0.36 : 0.3), 56, 150);
  const diceSize = clamp(layout.unit * 0.95, 34, 72);
  const round = Math.floor(view.turn / view.players.length) + 1;
  const showDeed = !landscape && layout.height > 330 && stage.focus !== null;
  const status = stage.dice?.rolling
    ? t("game.rolling")
    : thinking
      ? t("game.thinking", { name: names[current] ?? "" })
      : player && !player.isBot
        ? t("game.yourTurn", { name: names[current] ?? "" })
        : t("game.turnOf", { name: names[current] ?? "" });

  const pill = (
    <div className="flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: withAlpha(color, 0.5), background: withAlpha(color, 0.1) }}>
      <PawnShape index={current} size={14} />
      <span className="truncate text-xs font-medium text-text" aria-live="polite">
        {status}
      </span>
    </div>
  );

  const circle = view.circle ? (
    <div className="flex items-center gap-1.5 rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] text-cyan">
      <HandCoins size={13} strokeWidth={iconStroke} aria-hidden />
      {t("game.circleRound", { n: view.circle.members.length, amount: money(view.circle.pot) })}
    </div>
  ) : null;

  const dice = (
    <div style={{ height: diceSize * 1.15 }} className="flex items-center justify-center">
      <AnimatePresence mode="wait">
        {stage.dice ? (
          <motion.div key="dice" initial={{ opacity: 0, scale: 0.6, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Dice values={stage.dice.values} rolling={stage.dice.rolling} size={diceSize} label={stage.dice.rolling ? t("game.rolling") : `${stage.dice.values[0]} + ${stage.dice.values[1]}`} />
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }}>
            <Dice values={[5, 2]} rolling={false} size={diceSize * 0.8} label="" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const banner = (
    <AnimatePresence>
      {stage.banner && (
        <motion.div
          key={stage.banner.key}
          className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-center"
          initial={{ opacity: 0, y: -24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          <div className="flex items-center gap-3 rounded-2xl border bg-bg/90 px-4 py-2.5 shadow-2xl backdrop-blur" style={{ borderColor: playerColors[stage.banner.player] }}>
            <PawnShape index={stage.banner.player} size={22} active />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text3">{t("game.round", { n: round })}</div>
              <div className="font-serif text-xl font-black italic leading-tight" style={{ color: playerColors[stage.banner.player] }}>
                {t("game.turnOf", { name: names[stage.banner.player] ?? "" })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (landscape) {
    return (
      <div className="relative flex h-full w-full items-center justify-between gap-4 px-[6%]">
        {banner}
        <div className="flex min-w-0 flex-col items-center gap-2">
          <div className="font-serif font-black italic leading-none text-gold" style={{ fontSize: clamp(layout.unit * 0.9, 28, 76) }}>
            FINE
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-text3">{t("game.round", { n: round })}</div>
          <Fino mood={stage.mood} size={finoSize} label={t("fino.label")} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4">
          {pill}
          {dice}
          {circle}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center gap-2 px-2 py-3">
      {banner}
      {pill}
      <div className="flex items-center justify-center gap-3">
        <Fino mood={stage.mood} size={finoSize} label={t("fino.label")} />
      </div>
      {dice}
      {circle}
      {showDeed && stage.focus !== null && (
        <div className="mt-auto w-full">
          <SpaceDetails state={view} names={names} index={stage.focus} compact />
        </div>
      )}
    </div>
  );
}
