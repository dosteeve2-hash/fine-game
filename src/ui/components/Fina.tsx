"use client";

import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import { useEffect, useState } from "react";
import { finaFaces } from "../art/fina.generated";

export type MascotMood = "idle" | "happy" | "thinking" | "surprised" | "worried" | "celebrate";

interface Props {
  mood?: MascotMood;
  size?: number;
  label?: string;
  framed?: boolean;
  className?: string;
}

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
      return { rotate: -4, y: 0, x: 0, scale: 1, transition: { type: "spring", stiffness: 110, damping: 14 } };
    default:
      return { rotate: [-1, 1, -1], y: 0, x: 0, scale: 1, transition: { rotate: { duration: 6.5, repeat: Infinity, ease: "easeInOut" } } };
  }
}

export function Fina({ mood = "idle", size = 96, label, framed = true, className }: Props) {
  const reduced = Boolean(useReducedMotion());
  const [blink, setBlink] = useState(false);
  const canBlink = mood === "idle" || mood === "thinking";

  useEffect(() => {
    if (reduced || !canBlink) return;
    let timer = 0;
    let open = 0;
    const loop = () => {
      timer = window.setTimeout(() => {
        setBlink(true);
        open = window.setTimeout(() => setBlink(false), 140);
        loop();
      }, 2400 + Math.random() * 2600);
    };
    loop();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(open);
      setBlink(false);
    };
  }, [canBlink, reduced]);

  const face = blink && canBlink ? finaFaces.blink : finaFaces[mood];

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
              key={blink && canBlink ? "blink" : mood}
              className={framed ? "absolute bottom-[-6%] left-[6%] right-[6%] top-[8%]" : "absolute inset-0"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: blink ? 0.04 : 0.16 }}
              dangerouslySetInnerHTML={{ __html: face }}
            />
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
