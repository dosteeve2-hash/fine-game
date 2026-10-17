"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo } from "react";
import type { Anchor, CoinFlight } from "../useGame";

function locate(anchor: Anchor): { x: number; y: number } | null {
  const selector = "player" in anchor ? `[data-player-chip="${anchor.player}"]` : `[data-space="${anchor.space}"]`;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const visible = nodes.find(node => node.getClientRects().length > 0 && node.offsetParent !== null);
  if (!visible) return null;
  const rect = visible.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function Flight({ flight, onDone }: { flight: CoinFlight; onDone: (id: number) => void }) {
  const reduced = Boolean(useReducedMotion());
  const points = useMemo(() => ({ from: locate(flight.from), to: locate(flight.to) }), [flight]);

  useEffect(() => {
    if (!points.from || !points.to) onDone(flight.id);
  }, [points, flight.id, onDone]);

  if (!points.from || !points.to) return null;
  const { from, to } = points;
  const lift = Math.min(120, Math.hypot(to.x - from.x, to.y - from.y) * 0.35);
  return (
    <>
      {Array.from({ length: flight.count }, (_, index) => (
        <motion.span
          key={index}
          className="pointer-events-none fixed left-0 top-0 z-[60] block h-4 w-4 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 30%, #ffe3a1 0%, #f0a832 55%, #a8670b 100%)",
            boxShadow: "0 0 0 1px rgba(122,74,6,0.8), 0 4px 10px rgba(0,0,0,0.5)"
          }}
          initial={{ x: from.x - 8, y: from.y - 8, scale: 0.4, opacity: 0 }}
          animate={
            reduced
              ? { x: to.x - 8, y: to.y - 8, opacity: [0, 1, 0] }
              : {
                  x: [from.x - 8, (from.x + to.x) / 2 - 8 + (index - flight.count / 2) * 6, to.x - 8],
                  y: [from.y - 8, Math.min(from.y, to.y) - lift - 8, to.y - 8],
                  scale: [0.5, 1.1, 0.7],
                  opacity: [0, 1, 1, 0]
                }
          }
          transition={{ duration: reduced ? 0.3 : 0.75, delay: index * 0.06, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (index === flight.count - 1) onDone(flight.id);
          }}
        />
      ))}
    </>
  );
}

export function CoinLayer({ coins, onDone }: { coins: CoinFlight[]; onDone: (id: number) => void }) {
  return (
    <div aria-hidden>
      {coins.map(flight => (
        <Flight key={flight.id} flight={flight} onDone={onDone} />
      ))}
    </div>
  );
}
