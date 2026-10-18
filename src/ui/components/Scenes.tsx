"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { GameState } from "../../engine";
import { ArtIcon } from "../art";
import type { MessageKey } from "../messages/fr";
import { useText } from "../text";
import type { SceneKind, SceneShow } from "../useGame";
import { PawnShape } from "./Pawn";

interface Props {
  scene: SceneShow | null;
  state: GameState;
  names: string[];
  onClose: () => void;
}

const tones: Record<SceneKind, string> = {
  salary: "#f0a832",
  tax: "#e2706b",
  bank: "#e3be7a",
  circle: "#9fc2e0",
  rest: "#a9b2c6",
  audit: "#e2706b",
  auditExit: "#3cc48e",
  restart: "#9fc2e0"
};

function Rain({ count, size, reduced }: { count: number; size: number; reduced: boolean }) {
  if (reduced) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-0"
          style={{ left: `${8 + ((i * 37) % 84)}%` }}
          initial={{ y: -size, opacity: 0, rotate: 0 }}
          animate={{ y: size * 3.4, opacity: [0, 1, 1, 0], rotate: i % 2 ? 160 : -140 }}
          transition={{ duration: 1.1, delay: (i % 6) * 0.08 + Math.floor(i / 6) * 0.18, ease: "easeIn" }}
        >
          <ArtIcon name="game-icons:coins" size={size * 0.34} color="#f7c060" />
        </motion.span>
      ))}
    </>
  );
}

function Picture({ kind, size, reduced }: { kind: SceneKind; size: number; reduced: boolean }) {
  const big = size * 0.62;
  const settle = { type: "spring" as const, stiffness: 260, damping: 16 };
  const frames: Record<SceneKind, ReactNode> = {
    salary: (
      <>
        <motion.div initial={{ y: size * 0.25, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}>
          <ArtIcon name="noto:sunrise" size={big} />
        </motion.div>
        <Rain count={12} size={size} reduced={reduced} />
      </>
    ),
    tax: (
      <>
        <ArtIcon name="noto:balance-scale" size={big * 0.82} />
        <motion.div
          className="absolute"
          style={{ right: size * 0.04, top: size * 0.02 }}
          initial={{ y: -size * 0.5, rotate: -12, opacity: 0 }}
          animate={reduced ? { y: 0, opacity: 1, rotate: 0 } : { y: [-size * 0.5, size * 0.08, 0], rotate: [-12, 0, 0], opacity: 1, scaleY: [1, 0.86, 1] }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeIn" }}
        >
          <ArtIcon name="game-icons:stamper" size={size * 0.36} color="#ef8f87" />
        </motion.div>
      </>
    ),
    bank: (
      <>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, ...settle }}>
          <ArtIcon name="noto:bank" size={big} />
        </motion.div>
        <motion.svg
          viewBox="0 0 100 100"
          width={big * 1.08}
          height={big * 1.08}
          className="absolute"
          initial={{ rotate: 0, x: 0, opacity: 1 }}
          animate={reduced ? { opacity: 0 } : { rotate: [0, 120, 120], x: [0, 0, -size * 0.55], opacity: [1, 1, 0] }}
          transition={{ duration: 0.95, times: [0, 0.55, 1], ease: "easeInOut" }}
          aria-hidden
        >
          <circle cx={50} cy={50} r={46} fill="#2c3a55" stroke="#e3be7a" strokeWidth={3} />
          <circle cx={50} cy={50} r={34} fill="none" stroke="#e3be7a" strokeOpacity={0.45} strokeWidth={2} />
          {[0, 60, 120].map(angle => (
            <rect key={angle} x={47} y={18} width={6} height={64} rx={3} fill="#e3be7a" transform={`rotate(${angle} 50 50)`} />
          ))}
          <circle cx={50} cy={50} r={9} fill="#e3be7a" />
        </motion.svg>
      </>
    ),
    circle: (
      <>
        <motion.div className="absolute" style={{ top: size * 0.04 }} initial={{ x: -size * 0.5, opacity: 0 }} animate={{ x: -size * 0.28, opacity: 1 }} transition={settle}>
          <ArtIcon name="mdi:account-group" size={big * 0.5} color="#9fc2e0" />
        </motion.div>
        <motion.div className="absolute" style={{ top: size * 0.04 }} initial={{ x: size * 0.5, opacity: 0 }} animate={{ x: size * 0.28, opacity: 1 }} transition={settle}>
          <ArtIcon name="mdi:account-group" size={big * 0.5} color="#9fc2e0" style={{ transform: "scaleX(-1)" }} />
        </motion.div>
        <motion.div className="absolute" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, ...settle }}>
          <ArtIcon name="fluent-emoji-flat:handshake" size={big * 0.8} />
        </motion.div>
        <motion.div className="absolute" style={{ bottom: size * 0.02 }} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
          <ArtIcon name="game-icons:piggy-bank" size={size * 0.26} color="#e6c98f" />
        </motion.div>
      </>
    ),
    rest: (
      <>
        <motion.span
          className="absolute rounded-full"
          style={{ width: big * 1.2, height: big * 1.2, background: "radial-gradient(closest-side, rgba(240,168,50,0.28), rgba(240,168,50,0))" }}
          animate={reduced ? { opacity: 0.8 } : { scale: [0.8, 1.15, 0.9], opacity: [0.4, 1, 0.6] }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />
        <motion.div animate={reduced ? {} : { scale: [1, 1.04, 1] }} transition={{ duration: 1.6, ease: "easeInOut" }}>
          <ArtIcon name="noto:camping" size={big} />
        </motion.div>
      </>
    ),
    audit: (
      <>
        <motion.span
          className="absolute rounded-full"
          style={{ width: size * 1.1, height: size * 1.1, background: "radial-gradient(closest-side, rgba(226,112,107,0.55), rgba(226,112,107,0))" }}
          animate={reduced ? { opacity: 0.7 } : { opacity: [0.2, 1, 0.2, 1, 0.2], scale: [0.9, 1.05, 0.9, 1.05, 0.95] }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
        <motion.div className="absolute" style={{ top: 0 }} animate={reduced ? {} : { rotate: [-6, 6, -6, 6, 0] }} transition={{ duration: 1.2 }}>
          <ArtIcon name="game-icons:siren" size={size * 0.34} color="#ef8f87" />
        </motion.div>
        <ArtIcon name="game-icons:magnifying-glass" size={big * 0.7} color="#d9dfeb" style={{ marginTop: size * 0.18 }} />
        <motion.div
          className="absolute"
          style={{ right: size * 0.02, bottom: size * 0.06, transformOrigin: "85% 85%" }}
          initial={{ rotate: -50 }}
          animate={reduced ? { rotate: 0 } : { rotate: [-50, 8, -30, 8, -20, 8] }}
          transition={{ duration: 1.3, delay: 0.25, ease: "easeIn" }}
        >
          <ArtIcon name="game-icons:gavel" size={size * 0.4} color="#e6c98f" />
        </motion.div>
      </>
    ),
    auditExit: (
      <>
        <motion.div initial={{ y: size * 0.2, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}>
          <ArtIcon name="game-icons:exit-door" size={big} color="#d9dfeb" />
        </motion.div>
        <motion.div className="absolute" style={{ right: 0, bottom: size * 0.05 }} initial={{ scale: 1.8, opacity: 0, rotate: -18 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} transition={{ delay: 0.4, type: "spring", stiffness: 380, damping: 18 }}>
          <ArtIcon name="game-icons:stamper" size={size * 0.28} color="#3cc48e" />
        </motion.div>
      </>
    ),
    restart: (
      <>
        <motion.div className="absolute" initial={{ opacity: 1 }} animate={{ opacity: reduced ? 0 : [1, 1, 0] }} transition={{ duration: 1.2, times: [0, 0.6, 1] }}>
          <motion.div animate={reduced ? {} : { opacity: [1, 0.3, 1, 0.4, 1] }} transition={{ duration: 0.6 }}>
            <ArtIcon name="game-icons:lightning-storm" size={big} color="#9fc2e0" />
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: size * 0.12, rotate: -20 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: reduced ? 0 : 0.85, duration: 0.6 }}>
          <ArtIcon name="game-icons:sun" size={big} color="#f7c060" />
        </motion.div>
      </>
    )
  };
  return (
    <div className="relative flex items-center justify-center overflow-hidden" style={{ width: size, height: size }}>
      {frames[kind]}
    </div>
  );
}

export function Scenes({ scene, state, names, onClose }: Props) {
  const { t, money } = useText();
  const reduced = Boolean(useReducedMotion());
  const size = 168;

  return (
    <AnimatePresence>
      {scene && (
        <motion.div
          key={scene.id}
          className={`fixed inset-0 z-[55] flex items-center justify-center p-4 ${scene.blocking ? "bg-[#02060f]/60" : "pointer-events-none"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="status"
          aria-live="assertive"
          data-scene={scene.kind}
        >
          <motion.div
            className="pointer-events-auto relative w-[min(320px,86vw)] overflow-hidden rounded-3xl border bg-bg2/95 px-5 pb-5 pt-4 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur"
            style={{ borderColor: tones[scene.kind] }}
            initial={{ scale: 0.86, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <div className="mx-auto flex justify-center">
              <Picture kind={scene.kind} size={size} reduced={reduced} />
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              {scene.player >= 0 && <PawnShape index={scene.player} size={16} />}
              <h2 className="font-serif text-2xl font-black italic leading-tight" style={{ color: tones[scene.kind] }}>
                {t(`scene.${scene.kind}.title` as MessageKey)}
              </h2>
            </div>
            <p className="mt-1.5 text-sm leading-snug text-text2">
              {t(`scene.${scene.kind}.text` as MessageKey, {
                name: names[scene.player] ?? "",
                amount: money(scene.amount ?? 0),
                fee: money(state.config.auditFee),
                n: state.config.auditTurns
              })}
            </p>
            <span className="sr-only">{t("scene.skip")}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
