"use client";

import { motion, useReducedMotion } from "framer-motion";
import { House, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { playerSummary } from "../../engine";
import type { GameState } from "../../engine";
import { audio } from "../audio/engine";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";
import { playerColors } from "../theme";
import { ArtIcon } from "../art";
import type { MessageKey } from "../messages/fr";
import { chapterCount, useProfile, type Finished } from "../profile";
import { ChapterProgress } from "./ChapterBubble";
import { Logo } from "./Logo";
import { Mascot } from "./Mascot";
import { PawnShape, PawnsProvider } from "./Pawn";

interface Props {
  state: GameState;
  names: string[];
  pawns: string[];
  gameId: number;
  onReplay: () => void;
  onHome: () => void;
}

function Confetti() {
  const reduced = Boolean(useReducedMotion());
  const pieces = useMemo(
    () => Array.from({ length: 28 }, (_, index) => ({ index, x: Math.random() * 100, delay: Math.random() * 1.2, duration: 2.4 + Math.random() * 1.8, size: 8 + Math.random() * 10, drift: (Math.random() - 0.5) * 120 })),
    []
  );
  if (reduced) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {pieces.map(piece => (
        <motion.span
          key={piece.index}
          className="absolute top-0 block rounded-full"
          style={{
            left: `${piece.x}%`,
            width: piece.size,
            height: piece.size,
            background: "radial-gradient(circle at 35% 30%, #ffe3a1 0%, #f0a832 55%, #a8670b 100%)",
            boxShadow: "0 0 0 1px rgba(122,74,6,0.7)"
          }}
          initial={{ y: -40, x: 0, opacity: 0, rotateX: 0 }}
          animate={{ y: "105vh", x: piece.drift, opacity: [0, 1, 1, 0.8], rotateX: 720 }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "easeIn", repeat: 1, repeatDelay: 0.6 }}
        />
      ))}
    </div>
  );
}

export function ResultScreen({ state, names, pawns, gameId, onReplay, onHome }: Props) {
  const { t, money } = useI18n();
  const winnerIndex = state.players.findIndex(player => player.id === state.winner);
  const winnerName = names[winnerIndex] ?? "";
  const ranking = state.players
    .map((player, index) => ({ index, summary: playerSummary(state, player.id) }))
    .sort((a, b) => b.summary.netWorth - a.summary.netWorth);
  const rounds = Math.floor(state.turn / state.players.length) + 1;
  const freedom = state.endReason === "freedom";

  const { ready, finishGame } = useProfile();
  const [finished, setFinished] = useState<Finished | null>(null);
  const counted = useRef(false);
  const hasHuman = state.players.some(player => !player.isBot);

  useEffect(() => {
    const timer = window.setTimeout(() => audio.play("victory"), 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || counted.current || !hasHuman) return;
    counted.current = true;
    setFinished(finishGame(gameId));
  }, [ready, hasHuman, finishGame, gameId]);

  return (
    <PawnsProvider pawns={pawns}>
    <main data-testid="result-screen" className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-8 text-center lg:flex-row lg:gap-16 lg:text-left">
      <Confetti />
      <motion.div className="flex flex-col items-center lg:flex-1 lg:items-start" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 12 }}>
        <div className="flex items-end gap-3">
          <Mascot mood="celebrate" size={150} label={t("mascot.label")} />
          <ArtIcon name="game-icons:laurels-trophy" size={72} color="#f0a832" />
          <Logo size={64} className="ml-1" />
        </div>
        <h1 className="mt-4 font-serif text-5xl font-black italic leading-none text-gold lg:text-7xl">{freedom ? t("result.freedomTitle") : t("result.limitTitle")}</h1>
        <p className="mt-3 flex items-center gap-2 text-lg text-text">
          {winnerIndex >= 0 && <PawnShape index={winnerIndex} size={18} />}
          {freedom ? t("result.freedom", { name: winnerName }) : t("result.turnLimit", { name: winnerName })}
        </p>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-text3">{t("result.turns", { n: rounds })}</p>
        {finished && (
          <motion.div
            className="mt-5 w-full max-w-sm rounded-2xl border border-gold/50 bg-bg2/90 p-3.5 text-left"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 20 }}
            data-testid="chapter-reward"
          >
            <ChapterProgress chapter={finished.unlocked} />
            <p className="mt-2 font-serif text-xl font-black italic leading-tight text-gold">{t("chapter.done", { n: finished.completed })}</p>
            <p className="mt-1 text-sm leading-snug text-text2">
              {finished.unlocked > finished.completed
                ? t("chapter.next", { n: finished.unlocked, title: t(`chapter.${finished.unlocked}.title` as MessageKey) })
                : finished.completed >= chapterCount
                  ? t("chapter.allOpen")
                  : t("chapter.again")}
            </p>
          </motion.div>
        )}
      </motion.div>

      <motion.section
        className="w-full max-w-md rounded-3xl border border-line2 bg-bg2/90 p-5 shadow-2xl"
        aria-label={t("result.stats")}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 140, damping: 20 }}
      >
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text3">{t("result.stats")}</h2>
        <ol className="space-y-2">
          {ranking.map((row, position) => (
            <motion.li
              key={row.index}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + position * 0.1 }}
              className="flex items-center gap-3 rounded-2xl border bg-bg3 px-3 py-2.5 text-left"
              style={{ borderColor: position === 0 ? playerColors[row.index] : "#1f3054" }}
            >
              <span className="w-5 font-mono text-sm text-text3">{position + 1}</span>
              <PawnShape index={row.index} size={16} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{names[row.index]}</span>
                <span className="block font-mono text-[10px] text-text2">{t("result.passive", { amount: money(row.summary.income) })}</span>
              </span>
              <span className="font-mono text-sm font-semibold text-gold2">{money(row.summary.netWorth)}</span>
            </motion.li>
          ))}
        </ol>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onHome} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-line2 bg-bg3 text-sm hover:border-gold">
            <House size={17} strokeWidth={iconStroke} aria-hidden />
            {t("result.home")}
          </button>
          <button type="button" onClick={onReplay} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gold text-sm font-semibold text-bg hover:bg-gold2">
            <RotateCcw size={17} strokeWidth={iconStroke} aria-hidden />
            {t("result.replay")}
          </button>
        </div>
      </motion.section>
    </main>
    </PawnsProvider>
  );
}
