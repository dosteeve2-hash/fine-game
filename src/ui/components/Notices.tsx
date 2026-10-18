"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HandCoins, Landmark, Receipt, RotateCcw, ShieldCheck, Store, TrendingDown, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import type { GameState } from "../../engine";
import { iconStroke } from "../icons";
import { useText } from "../text";
import type { Notice } from "../useGame";
import { PawnShape } from "./Pawn";

interface Props {
  notices: Notice[];
  state: GameState;
  names: string[];
  onDismiss: (id: number) => void;
}

const icons: Record<string, LucideIcon> = {
  "start.salary": Wallet,
  "tax.paid": Receipt,
  "rent.paid": HandCoins,
  "asset.bought": Store,
  "asset.sold": TrendingUp,
  "asset.forced_sale": TrendingDown,
  "loan.taken": Landmark,
  "loan.repaid": Landmark,
  "loan.defaulted": Landmark,
  "insurance.bought": ShieldCheck,
  "circle.joined": HandCoins,
  "circle.default": HandCoins,
  "circle.payout": HandCoins,
  "circle.contribution": HandCoins,
  "turn.statement": Receipt,
  "player.restarted": RotateCcw
};

const losses = new Set(["tax.paid", "rent.paid", "asset.forced_sale", "loan.defaulted", "circle.default", "circle.contribution", "player.restarted"]);

function NoticeItem({ notice, state, names, onDismiss }: { notice: Notice; state: GameState; names: string[]; onDismiss: (id: number) => void }) {
  const { eventText } = useText();
  const text = eventText(notice.event, state, names, notice.owner);
  const playerIndex = state.players.findIndex(player => player.id === notice.event.playerId);
  const Icon = icons[notice.event.type] ?? Wallet;
  const loss = losses.has(notice.event.type) || (notice.event.type === "turn.statement" && (notice.event.amount ?? 0) < 0);

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(notice.id), 3400);
    return () => window.clearTimeout(timer);
  }, [notice.id, onDismiss]);

  if (!text) return null;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="pointer-events-auto"
    >
      <button
        type="button"
        onClick={() => onDismiss(notice.id)}
        className="flex w-full items-center gap-2.5 rounded-2xl border bg-bg2/95 px-3 py-2.5 text-left text-sm shadow-[0_14px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur"
        style={{ borderColor: loss ? "rgba(248,113,113,0.45)" : "rgba(34,217,138,0.4)" }}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${loss ? "bg-red/15 text-red" : "bg-green/15 text-green"}`}>
          <Icon size={17} strokeWidth={iconStroke} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 leading-snug text-text">{text}</span>
        {playerIndex >= 0 && <PawnShape index={playerIndex} size={14} />}
      </button>
    </motion.li>
  );
}

export function Notices({ notices, state, names, onDismiss }: Props) {
  return (
    <ul className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+124px)] z-40 mx-auto flex w-full max-w-sm flex-col gap-2 px-4 lg:right-[380px] lg:top-8 xl:right-[420px]" aria-live="polite">
      <AnimatePresence initial={false}>
        {notices.map(notice => (
          <NoticeItem key={notice.id} notice={notice} state={state} names={names} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </ul>
  );
}
