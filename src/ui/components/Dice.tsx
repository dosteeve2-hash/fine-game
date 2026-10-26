"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const pipLayout: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]]
};

function Face({ value, size }: { value: number; size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id="die-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffdf7" />
          <stop offset="100%" stopColor="#e6dccb" />
        </linearGradient>
      </defs>
      <rect x={3} y={3} width={94} height={94} rx={22} fill="url(#die-face)" stroke="#9b6800" strokeWidth={3} />
      <rect x={9} y={9} width={82} height={82} rx={17} fill="none" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.5} />
      {(pipLayout[value] ?? []).map(([cx, cy], index) => (
        <circle key={index} cx={cx} cy={cy} r={value === 1 ? 11 : 8.5} fill={value === 1 ? "#9b6800" : "#20204a"} />
      ))}
    </svg>
  );
}

function Die({ value, rolling, size, delay }: { value: number; rolling: boolean; size: number; delay: number }) {
  const reduced = Boolean(useReducedMotion());
  const [face, setFace] = useState(value);

  useEffect(() => {
    if (!rolling) {
      setFace(value);
      return;
    }
    let pause = 60;
    let timer = 0;
    const tick = () => {
      setFace(1 + Math.floor(Math.random() * 6));
      pause = Math.min(320, pause * 1.16);
      timer = window.setTimeout(tick, pause);
    };
    timer = window.setTimeout(tick, pause);
    return () => window.clearTimeout(timer);
  }, [rolling, value]);

  return (
    <motion.div
      style={{ width: size, height: size, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }}
      animate={
        rolling && !reduced
          ? { rotate: [0, 200, 330, 380, 360], y: [0, -size * 0.45, 0, -size * 0.2, 0, -size * 0.06, 0], x: [0, size * 0.1, -size * 0.06, size * 0.03, 0], scale: [1, 0.92, 1.04, 1] }
          : { rotate: 0, y: [-size * 0.12, 0, -size * 0.05, 0], x: 0, scale: [1.06, 0.96, 1] }
      }
      transition={rolling && !reduced ? { duration: 1.25, ease: [0.2, 0.7, 0.3, 1], delay } : { duration: reduced ? 0.1 : 0.32, ease: "easeOut" }}
    >
      <Face value={face} size={size} />
    </motion.div>
  );
}

export function Dice({ values, rolling, size = 44, label }: { values: [number, number]; rolling: boolean; size?: number; label: string }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: size * 0.28 }} role="img" aria-label={label} aria-live="polite">
      <Die value={values[0]} rolling={rolling} size={size} delay={0} />
      <Die value={values[1]} rolling={rolling} size={size} delay={0.08} />
    </div>
  );
}
