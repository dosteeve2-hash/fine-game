"use client";

import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import { useEffect, useId, useState } from "react";

export type FinoMood = "idle" | "happy" | "thinking" | "surprised" | "worried" | "celebrate";

interface Props {
  mood?: FinoMood;
  size?: number;
  label?: string;
  className?: string;
}

const ink = "#2a1704";

function bodyMotion(mood: FinoMood, reduced: boolean): TargetAndTransition {
  if (reduced) return { y: 0, rotate: 0, scale: 1, x: 0 };
  switch (mood) {
    case "happy":
      return { y: [0, -9, 0, -4, 0], rotate: 0, x: 0, scale: 1, transition: { duration: 0.9, ease: "easeOut" } };
    case "celebrate":
      return { y: [0, -14, 0], rotate: [-7, 7, -7], x: 0, scale: 1, transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" } };
    case "surprised":
      return { y: [0, -6, 0], scale: [1, 1.07, 1], rotate: 0, x: 0, transition: { duration: 0.45, ease: "easeOut" } };
    case "worried":
      return { x: [-1.5, 1.5, -1.5], y: 0, rotate: 0, scale: 1, transition: { duration: 0.5, repeat: 3, ease: "easeInOut" } };
    case "thinking":
      return { rotate: -7, y: [0, -2, 0], x: 0, scale: 1, transition: { y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }, rotate: { type: "spring", stiffness: 120, damping: 14 } } };
    default:
      return { y: [0, -3, 0], rotate: 0, x: 0, scale: 1, transition: { y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 0.4 } } };
  }
}

function Star({ x, y, size, delay, reduced }: { x: number; y: number; size: number; delay: number; reduced: boolean }) {
  const s = size;
  return (
    <motion.path
      d={`M${x} ${y - s} C${x + s * 0.18} ${y - s * 0.18} ${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} C${x + s * 0.18} ${y + s * 0.18} ${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} C${x - s * 0.18} ${y + s * 0.18} ${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} C${x - s * 0.18} ${y - s * 0.18} ${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`}
      fill="#fff6dc"
      style={{ transformOrigin: `${x}px ${y}px` }}
      initial={{ scale: 0.6, opacity: 0.6 }}
      animate={reduced ? { scale: 1, opacity: 1 } : { scale: [0.55, 1.1, 0.55], opacity: [0.5, 1, 0.5] }}
      transition={reduced ? undefined : { duration: 2.2, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

export function Fino({ mood = "idle", size = 96, label, className }: Props) {
  const reduced = Boolean(useReducedMotion());
  const id = useId().replace(/:/g, "");
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (reduced || mood === "happy" || mood === "celebrate") return;
    let timer = 0;
    const loop = () => {
      timer = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 140);
        loop();
      }, 2600 + Math.random() * 2200);
    };
    loop();
    return () => window.clearTimeout(timer);
  }, [mood, reduced]);

  const happyEyes = mood === "happy" || mood === "celebrate";
  const pupil = mood === "thinking" ? { x: 2.6, y: -3.2 } : mood === "worried" ? { x: 0, y: 2.2 } : { x: 0, y: 0 };
  const eyeScale = mood === "surprised" ? 1.14 : 1;
  const pupilR = mood === "surprised" ? 3.6 : 4.8;

  return (
    <motion.svg
      viewBox="0 0 120 124"
      width={size}
      height={size * (124 / 120)}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`face-${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffe3a1" />
          <stop offset="45%" stopColor="#f7c060" />
          <stop offset="100%" stopColor="#d48a14" />
        </radialGradient>
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7c060" />
          <stop offset="55%" stopColor="#c07d10" />
          <stop offset="100%" stopColor="#8a5609" />
        </linearGradient>
        <linearGradient id={`shine-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.ellipse
        cx={60}
        cy={118}
        rx={30}
        ry={4.5}
        fill="#000"
        opacity={0.35}
        animate={reduced || mood === "worried" ? { scaleX: 1 } : { scaleX: mood === "celebrate" ? [1, 0.7, 1] : [1, 0.92, 1] }}
        transition={{ duration: mood === "celebrate" ? 0.7 : 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 118px" }}
      />

      <motion.g animate={bodyMotion(mood, reduced)} style={{ transformOrigin: "60px 60px" }}>
        <circle cx={60} cy={60} r={52} fill={`url(#rim-${id})`} />
        <circle cx={60} cy={60} r={49.5} fill="none" stroke="#7a4a06" strokeOpacity={0.55} strokeWidth={3} strokeDasharray="2.2 2.6" />
        <circle cx={60} cy={60} r={45} fill={`url(#face-${id})`} />
        <circle cx={60} cy={60} r={40.5} fill="none" stroke="#fff3cf" strokeOpacity={0.45} strokeWidth={1.2} />
        <circle cx={60} cy={61.5} r={40.5} fill="none" stroke="#a8670b" strokeOpacity={0.35} strokeWidth={1.2} />
        <motion.path
          d="M28 46 C32 30 46 21 61 20 C50 25 40 33 35 47 Z"
          fill={`url(#shine-${id})`}
          animate={reduced ? { opacity: 0.7 } : { opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />

        <ellipse cx={38} cy={72} rx={6.5} ry={4} fill="#ff8f5a" opacity={happyEyes ? 0.5 : 0.28} />
        <ellipse cx={82} cy={72} rx={6.5} ry={4} fill="#ff8f5a" opacity={happyEyes ? 0.5 : 0.28} />

        {mood === "worried" && (
          <>
            <path d="M36 43 Q43 38 51 43" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" transform="rotate(14 43 41)" />
            <path d="M69 43 Q77 38 84 43" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" transform="rotate(-14 77 41)" />
          </>
        )}
        {mood === "surprised" && (
          <>
            <path d="M36 37 Q44 31 52 37" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />
            <path d="M68 37 Q76 31 84 37" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          </>
        )}
        {mood === "thinking" && (
          <>
            <path d="M37 43 L51 42" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
            <path d="M68 39 Q76 33 84 38" stroke={ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          </>
        )}

        {happyEyes ? (
          <>
            <path d="M36 58 Q44 47 52 58" stroke={ink} strokeWidth={3.6} strokeLinecap="round" fill="none" />
            <path d="M68 58 Q76 47 84 58" stroke={ink} strokeWidth={3.6} strokeLinecap="round" fill="none" />
          </>
        ) : (
          [44, 76].map(cx => (
            <motion.g
              key={cx}
              animate={{ scaleY: blink ? 0.08 : 1, scale: eyeScale }}
              transition={{ duration: blink ? 0.06 : 0.2 }}
              style={{ transformOrigin: `${cx}px 55px` }}
            >
              <ellipse cx={cx} cy={55} rx={8.6} ry={10.6} fill="#fffaf0" />
              <motion.g animate={{ x: pupil.x, y: pupil.y }} transition={{ type: "spring", stiffness: 160, damping: 16 }}>
                <circle cx={cx + 0.6} cy={56.5} r={pupilR} fill={ink} />
                <circle cx={cx + 2.2} cy={54} r={1.7} fill="#ffffff" />
              </motion.g>
            </motion.g>
          ))
        )}

        {mood === "idle" && <path d="M49 77 Q60 86 71 77" stroke={ink} strokeWidth={3.2} strokeLinecap="round" fill="none" />}
        {(mood === "happy" || mood === "celebrate") && (
          <g>
            <path d={mood === "celebrate" ? "M45 72 Q60 96 75 72 Z" : "M47 73 Q60 91 73 73 Z"} fill={ink} />
            <path d={mood === "celebrate" ? "M52 84 Q60 78 68 84 Q60 91 52 84 Z" : "M53 82 Q60 77 67 82 Q60 87 53 82 Z"} fill="#ff7a6b" />
          </g>
        )}
        {mood === "thinking" && <path d="M53 80 Q60 77 68 81" stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />}
        {mood === "surprised" && <ellipse cx={60} cy={80} rx={5.2} ry={6.6} fill={ink} />}
        {mood === "worried" && <path d="M48 81 Q54 76 60 81 Q66 86 72 81" stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />}

        {mood === "worried" && (
          <motion.path
            d="M90 36 C93 42 95 45 95 48 A5 5 0 0 1 85 48 C85 45 87 42 90 36 Z"
            fill="#a5dcff"
            stroke="#5fb4f0"
            strokeWidth={0.8}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          />
        )}
      </motion.g>

      <Star x={98} y={16} size={7} delay={0} reduced={reduced} />
      {mood === "celebrate" && (
        <>
          <Star x={14} y={22} size={6} delay={0.3} reduced={reduced} />
          <Star x={108} y={64} size={5} delay={0.6} reduced={reduced} />
          <Star x={10} y={78} size={4.5} delay={0.9} reduced={reduced} />
        </>
      )}
      {mood === "thinking" && !reduced && (
        <g>
          {[0, 1, 2].map(i => (
            <motion.circle
              key={i}
              cx={96 + i * 8}
              cy={34 - i * 6}
              r={2.2 + i * 0.6}
              fill="#9ba8c4"
              animate={{ opacity: [0.15, 1, 0.15] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </g>
      )}
    </motion.svg>
  );
}
