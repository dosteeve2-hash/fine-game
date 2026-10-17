"use client";

import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";

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
}

export function DeltaFloats({ value }: { value: number }) {
  const { money } = useI18n();
  const [floats, setFloats] = useState<Float[]>([]);
  const previous = useRef(value);
  const counter = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const delta = Math.round(value - previous.current);
    previous.current = value;
    if (delta === 0) return;
    counter.current += 1;
    const id = counter.current;
    setFloats(items => [...items.slice(-2), { id, amount: delta }]);
    timers.current.push(window.setTimeout(() => setFloats(items => items.filter(item => item.id !== id)), 1900));
  }, [value]);

  useEffect(() => () => timers.current.forEach(timer => window.clearTimeout(timer)), []);

  return (
    <span className="pointer-events-none absolute inset-x-0 -top-1 flex justify-center" aria-hidden>
      <AnimatePresence>
        {floats.map((item, index) => (
          <motion.span
            key={item.id}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: -18 - index * 14, scale: 1 }}
            exit={{ opacity: 0, y: -34 - index * 14 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`absolute whitespace-nowrap rounded-full px-1.5 font-mono text-[11px] font-semibold shadow-lg ${item.amount > 0 ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}
          >
            {item.amount > 0 ? "+" : "−"}
            {money(Math.abs(item.amount))}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
