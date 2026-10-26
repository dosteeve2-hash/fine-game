"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye } from "lucide-react";
import type { GameState } from "../../engine";
import { ArtIcon } from "../art";
import type { Orientation } from "../board/geometry";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";
import { playerColors, withAlpha } from "../theme";
import type { Stage } from "../useGame";
import { Dice } from "./Dice";
import { Logo } from "./Logo";
import { Mascot } from "./Mascot";
import { PawnShape } from "./Pawn";
import { SpaceDetails } from "./SpaceDetails";

interface Props {
  view: GameState;
  stage: Stage;
  names: string[];
  thinking: boolean;
  layout: { orientation: Orientation; unit: number; width: number; height: number };
  /** Banner and dice are drawn by the phone camera overlay instead of the board centre. */
  external?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function DiceTray({ stage, size }: { stage: Stage; size: number }) {
  const { t } = useI18n();
  return (
    <div style={{ height: size * 1.15 }} className="flex items-center justify-center">
      <AnimatePresence mode="wait">
        {stage.dice ? (
          <motion.div key="dice" initial={{ opacity: 0, scale: 0.6, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Dice values={stage.dice.values} rolling={stage.dice.rolling} size={size} label={stage.dice.rolling ? t("game.rolling") : `${stage.dice.values[0]} + ${stage.dice.values[1]}`} />
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }}>
            <Dice values={[5, 2]} rolling={false} size={size * 0.8} label="" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TurnBanner({ stage, names, round, className = "pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-center" }: { stage: Stage; names: string[]; round: number; className?: string }) {
  const { t } = useI18n();
  return (
    <AnimatePresence>
      {stage.banner && (
        <motion.div
          key={stage.banner.key}
          className={className}
          initial={{ opacity: 0, y: -24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          <div
            className="flex max-w-full items-center gap-3 rounded-2xl border bg-bg px-4 py-2.5 shadow-2xl"
            style={{
              borderColor: stage.banner.human ? "#f2a900" : "#55536d",
              boxShadow: stage.banner.human ? "0 0 0 1px rgba(242,169,0,0.5), 0 18px 50px -16px rgba(242,169,0,0.4)" : undefined
            }}
          >
            <PawnShape index={stage.banner.player} size={24} active />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-text3">
                {stage.banner.human ? t("game.round", { n: round }) : (
                  <>
                    <Eye size={11} strokeWidth={iconStroke} aria-hidden />
                    {t("spectator.label")}
                  </>
                )}
              </div>
              <div className={`truncate font-serif font-black italic leading-tight ${stage.banner.human ? "text-xl text-gold lg:text-3xl" : "text-lg text-text lg:text-2xl"}`}>
                {stage.banner.human ? t("turn.you", { name: names[stage.banner.player] ?? "" }) : t("game.turnOf", { name: names[stage.banner.player] ?? "" })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BoardCenter({ view, stage, names, thinking, layout, external = false }: Props) {
  const { t, money } = useI18n();
  const current = view.currentPlayerIndex;
  const player = view.players[current];
  const color = playerColors[current] ?? "#f0a832";
  const landscape = layout.orientation === "landscape";
  const finaSize = clamp(Math.min(layout.width, layout.height) * (landscape ? 0.4 : 0.32), 60, 170);
  const diceSize = clamp(layout.unit * 0.95, 34, 72);
  const round = Math.floor(view.turn / view.players.length) + 1;
  const showDeed = !landscape && layout.height > 330 && stage.focus !== null;
  const held = player ? (player.auditTurns ?? 0) > 0 : false;
  const status = stage.dice?.rolling
    ? t("game.rolling")
    : stage.hop
      ? t("game.moving", { name: names[stage.hop.player] ?? "", n: (stage.dice?.values[0] ?? 0) + (stage.dice?.values[1] ?? 0) })
      : thinking
        ? t("game.thinking", { name: names[current] ?? "" })
        : held && player && !player.isBot
          ? t("audit.heldYou", { n: player.auditTurns })
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
    <div className="flex items-center gap-1.5 rounded-full border border-line2 bg-bg2/80 px-2.5 py-1 font-mono text-[10px] text-text2">
      <ArtIcon name="game-icons:piggy-bank" size={14} color="#e6c98f" />
      {t("game.circleRound", { n: view.circle.members.length, amount: money(view.circle.pot) })}
    </div>
  ) : null;

  const dice = external ? null : <DiceTray stage={stage} size={diceSize} />;
  const banner = external ? null : <TurnBanner stage={stage} names={names} round={round} />;

  if (landscape) {
    return (
      <div className="relative flex h-full w-full items-center justify-between gap-4 px-[6%]">
        {banner}
        <div className="flex min-w-0 flex-col items-center gap-2">
          <Logo size={clamp(layout.unit * 1.1, 40, 92)} />
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-text3">{t("game.round", { n: round })}</div>
          <Mascot mood={stage.mood} size={finaSize} label={t("mascot.label")} />
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
      <Mascot mood={stage.mood} size={finaSize} label={t("mascot.label")} />
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
