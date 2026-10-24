"use client";

import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import { useEffect } from "react";

export type MascotMood = "idle" | "happy" | "thinking" | "surprised" | "worried" | "celebrate";

interface Props {
  mood?: MascotMood;
  size?: number;
  label?: string;
  framed?: boolean;
  className?: string;
}

const sources: Record<MascotMood, string> = {
  idle: "/mascot/idle.webp",
  happy: "/mascot/happy.webp",
  thinking: "/mascot/thinking.webp",
  surprised: "/mascot/surprised.webp",
  worried: "/mascot/worried.webp",
  celebrate: "/mascot/celebrate.webp"
};

/** Where the gold coin (or the watch) sits in each picture, as a share of its width and height. */
const glints: Record<MascotMood, { x: number; y: number } | null> = {
  idle: { x: 0.3, y: 0.395 },
  happy: { x: 0.3, y: 0.38 },
  thinking: null,
  surprised: { x: 0.255, y: 0.41 },
  worried: { x: 0.25, y: 0.44 },
  celebrate: { x: 0.225, y: 0.045 }
};

const topShift: Record<MascotMood, number> = { idle: 0, happy: 0, thinking: 0, surprised: 0, worried: 0, celebrate: -0.15 };

function reaction(mood: MascotMood, reduced: boolean): TargetAndTransition {
  if (reduced) return { y: 0, x: 0, rotate: 0, scale: 1 };
  switch (mood) {
    case "happy":
      return { y: [0, -6, 0, -2, 0], rotate: [0, -2, 1, 0], x: 0, scale: 1, transition: { duration: 0.9, ease: "easeOut" } };
    case "celebrate":
      return { y: [0, -9, 0], rotate: [-3, 3, -3], x: 0, scale: 1, transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" } };
    case "surprised":
      return { y: [0, -8, 0], scale: [1, 1.06, 1], rotate: 0, x: 0, transition: { duration: 0.45, ease: "easeOut" } };
    case "worried":
      return { x: [-1.4, 1.4, -1.4, 0], y: 0, rotate: [0, -1, 0], scale: 1, transition: { duration: 0.6, repeat: 2, ease: "easeInOut" } };
    case "thinking":
      return { rotate: -3, y: 0, x: 0, scale: 1, transition: { type: "spring", stiffness: 110, damping: 14 } };
    default:
      return { rotate: [-1, 1, -1], y: 0, x: 0, scale: 1, transition: { rotate: { duration: 6.5, repeat: Infinity, ease: "easeInOut" } } };
  }
}

let warmed = false;
function warmUp() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  for (const src of Object.values(sources)) {
    const image = new window.Image();
    image.src = src;
  }
}

/** Monsieur Fin, the guide: one painted portrait per mood, blended softly into each other. */
export function Mascot({ mood = "idle", size = 96, label, framed = true, className }: Props) {
  const reduced = Boolean(useReducedMotion());
  useEffect(() => warmUp(), []);

  const width = framed ? size * 1.3 : size * 0.75;
  const height = (width * 4) / 3;
  const glint = glints[mood];
  const left = framed ? size / 2 - width * 0.47 : (size - width) / 2;
  const top = framed ? size * topShift[mood] : size - height;

  return (
    <div
      className={`relative shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {framed && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(75% 75% at 50% 35%, #1b2b4b 0%, #0c1528 70%, #070e1f 100%)",
            boxShadow: "inset 0 0 0 1.5px rgba(240,168,50,0.55), inset 0 0 0 4px rgba(7,14,31,0.9), inset 0 0 0 5px rgba(240,168,50,0.18), 0 10px 30px -12px rgba(0,0,0,0.8)"
          }}
        />
      )}
      <motion.div
        className={`absolute inset-0 ${framed ? "overflow-hidden rounded-full" : ""}`}
        animate={reduced ? { scale: 1 } : { scale: [1, 1.018, 1] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "50% 100%" }}
      >
        <motion.div className="absolute inset-0" animate={reaction(mood, reduced)} style={{ transformOrigin: "50% 90%" }}>
          <AnimatePresence initial={false}>
            <motion.div
              key={mood}
              className="absolute"
              style={{ width, height, left, top }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <img src={sources[mood]} alt="" width={576} height={768} draggable={false} decoding="async" className="h-full w-full select-none object-contain" />
              {glint && !reduced && size >= 56 && (
                <motion.span
                  className="pointer-events-none absolute block"
                  style={{ left: `${glint.x * 100}%`, top: `${glint.y * 100}%`, width: width * 0.16, height: width * 0.16, marginLeft: -width * 0.08, marginTop: -width * 0.08 }}
                  animate={{ opacity: [0, 0.95, 0], scale: [0.4, 1, 0.4], rotate: [0, 45, 90] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
                  aria-hidden
                >
                  <svg viewBox="-10 -10 20 20" className="h-full w-full">
                    <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" fill="#fff6d8" />
                  </svg>
                </motion.span>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
      {mood === "thinking" && !reduced && (
        <span className="pointer-events-none absolute -right-[2%] top-[6%] flex gap-[3px]" aria-hidden>
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="block rounded-full bg-text2"
              style={{ width: Math.max(3, size * 0.045), height: Math.max(3, size * 0.045) }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </span>
      )}
      {mood === "celebrate" && !reduced && (
        <span className="pointer-events-none absolute inset-0" aria-hidden>
          {[[8, 12], [86, 18], [92, 62], [4, 70]].map(([x, y], i) => (
            <motion.span
              key={i}
              className="absolute block rotate-45 bg-gold2"
              style={{ left: `${x}%`, top: `${y}%`, width: size * 0.05, height: size * 0.05 }}
              animate={{ scale: [0.3, 1.1, 0.3], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </span>
      )}
    </div>
  );
}
