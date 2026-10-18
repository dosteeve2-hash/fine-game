"use client";

import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { GameState } from "../../engine";
import { useI18n } from "../i18n";
import { useText } from "../text";
import type { MoveRecord } from "../useGame";

export function CountUp({ value, className }: { value: number; className?: string }) {
  const { money } = useI18n();
  const reduced = Boolean(useReducedMotion());
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration: Math.min(1.2, 0.35 + Math.abs(value - from.current) / 900),
      ease: "easeOut",
      onUpdate: latest => setShown(latest)
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduced]);

  return <span className={className}>{money(shown)}</span>;
}

interface Float {
  id: number;
  amount: number;
  label: string;
}

interface FloatsProps {
  moves: MoveRecord[];
  state: GameState;
  names: string[];
  align?: "start" | "center" | "end";
}

const alignClass = { start: "items-start", center: "items-center", end: "items-end" } as const;

export function DeltaFloats({ moves, state, names, align = "center" }: FloatsProps) {
  const { money } = useI18n();
  const { moveText } = useText();
  const reduced = Boolean(useReducedMotion());
  const [floats, setFloats] = useState<Float[]>([]);
  const seen = useRef(moves.length > 0 ? (moves[moves.length - 1]?.id ?? 0) : 0);
  const timers = useRef<number[]>([]);
  const latest = useRef({ state, names, moveText });
  latest.current = { state, names, moveText };

  useEffect(() => {
    const fresh = moves.filter(move => move.id > seen.current);
    if (fresh.length === 0) return;
    seen.current = fresh[fresh.length - 1]?.id ?? seen.current;
    fresh.slice(-5).forEach((move, index) => {
      const show = () => {
        const { state: current, names: currentNames, moveText: describe } = latest.current;
        setFloats(items => [...items.slice(-3), { id: move.id, amount: move.amount, label: describe(move, current, currentNames) }]);
        timers.current.push(window.setTimeout(() => setFloats(items => items.filter(item => item.id !== move.id)), 2800));
      };
      if (index === 0) show();
      else timers.current.push(window.setTimeout(show, index * 450));
    });
  }, [moves]);

  useEffect(() => () => timers.current.forEach(timer => window.clearTimeout(timer)), []);

  return (
    <span className={`pointer-events-none absolute inset-x-0 top-full z-30 mt-1 flex flex-col gap-1 ${alignClass[align]}`} aria-hidden>
      <AnimatePresence>
        {floats.map(item => (
          <motion.span
            key={item.id}
            initial={{ opacity: 0, y: reduced ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : 6 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={`flex max-w-[11.5rem] items-baseline gap-1.5 rounded-lg border px-2 py-0.5 shadow-lg backdrop-blur ${item.amount > 0 ? "border-green/40 bg-bg2/95 text-green" : "border-red/40 bg-bg2/95 text-red"}`}
          >
            <span className="shrink-0 font-mono text-[11px] font-semibold">
              {item.amount > 0 ? "+" : "−"}
              {money(Math.abs(item.amount))}
            </span>
            <span className="text-[10px] leading-tight text-text2">{item.label}</span>
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
