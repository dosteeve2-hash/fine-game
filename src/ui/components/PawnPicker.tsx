"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Bot, Check, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { pawns, type PawnId } from "../art/pawns";
import { useAudio } from "../audio/AudioProvider";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";
import type { MessageKey } from "../messages/fr";
import { playerColors } from "../theme";
import type { Seat } from "../useGame";
import { PawnShape } from "./Pawn";

const memoryKey = "fine.pawn";

function remembered(): PawnId | null {
  try {
    const value = window.localStorage.getItem(memoryKey);
    return pawns.some(pawn => pawn.id === value) ? (value as PawnId) : null;
  } catch {
    return null;
  }
}

function remember(id: string) {
  try {
    window.localStorage.setItem(memoryKey, id);
  } catch {
    return;
  }
}

export function completePawns(seats: Seat[], picks: (string | null)[]): Seat[] {
  const taken = new Set(picks.filter((pick): pick is string => pick !== null));
  const free: string[] = pawns.map(pawn => pawn.id).filter(id => !taken.has(id));
  return seats.map((seat, index) => {
    const pick = picks[index];
    if (pick) return { ...seat, pawn: pick };
    const [random] = free.splice(Math.floor(Math.random() * free.length), 1);
    return { ...seat, pawn: random ?? pawns[0].id };
  });
}

interface Props {
  seats: Seat[];
  onBack: () => void;
  onDone: (seats: Seat[]) => void;
}

export function PawnPicker({ seats, onBack, onDone }: Props) {
  const { t } = useI18n();
  const { play, unlock } = useAudio();
  const reduced = Boolean(useReducedMotion());
  const humans = useMemo(() => seats.map((seat, index) => (seat.isBot ? -1 : index)).filter(index => index >= 0), [seats]);
  const [picks, setPicks] = useState<(string | null)[]>(() => seats.map(() => null));
  const [step, setStep] = useState(0);
  const seatIndex = humans[step] ?? -1;
  const [selected, setSelected] = useState<string>(pawns[0].id);

  useEffect(() => {
    const taken = new Set(picks.filter((pick): pick is string => pick !== null));
    const preferred = step === 0 ? remembered() : null;
    const first = preferred && !taken.has(preferred) ? preferred : pawns.find(pawn => !taken.has(pawn.id))?.id ?? pawns[0].id;
    setSelected(first);
  }, [step, picks]);

  const takenBy = (id: string) => picks.findIndex((pick, index) => pick === id && index !== seatIndex);
  const color = playerColors[seatIndex] ?? playerColors[0];

  const finish = (finalPicks: (string | null)[]) => onDone(completePawns(seats, finalPicks));

  const confirm = () => {
    unlock();
    play("click");
    const next = picks.map((pick, index) => (index === seatIndex ? selected : pick));
    if (step === 0) remember(selected);
    setPicks(next);
    if (step + 1 < humans.length) setStep(step + 1);
    else finish(next);
  };

  if (seatIndex < 0) {
    return null;
  }

  const name = seats[seatIndex]?.name ?? "";

  return (
    <main className="mx-auto flex h-dvh w-full max-w-6xl flex-col px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] lg:px-10 lg:py-10">
      <div className="flex items-center gap-2">
        <button type="button" onClick={step > 0 ? () => setStep(step - 1) : onBack} aria-label={t("pawn.back")} className="flex h-11 w-11 items-center justify-center rounded-xl border border-line2 text-text2 hover:border-gold hover:text-gold2">
          <ArrowLeft size={19} strokeWidth={iconStroke} />
        </button>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text3">{t("pawn.step", { n: step + 1, total: humans.length })}</div>
          <h1 className="truncate font-serif text-2xl font-black italic leading-tight text-gold lg:text-4xl">{t("pawn.title", { name })}</h1>
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-4 lg:mt-8 lg:flex-row lg:gap-10">
        <section className="flex shrink-0 items-center gap-4 rounded-3xl border border-line2 bg-bg2/80 p-3 lg:w-[360px] lg:flex-col lg:justify-center lg:p-8" aria-live="polite">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center lg:h-64 lg:w-64">
            <span className="absolute inset-[12%] rounded-full" style={{ background: `radial-gradient(closest-side, ${color}33, transparent)` }} aria-hidden />
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ y: -30, opacity: 0, scale: 0.7 }}
                animate={reduced ? { y: 0, opacity: 1, scale: 1 } : { y: [0, -8, 0], opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.8 }}
                transition={reduced ? { duration: 0.1 } : { y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.2 }, scale: { type: "spring", stiffness: 260, damping: 16 } }}
                className="hidden lg:block"
              >
                <PawnShape index={seatIndex} pawn={selected} size={150} active />
              </motion.div>
            </AnimatePresence>
            <div className="lg:hidden">
              <PawnShape index={seatIndex} pawn={selected} size={70} active />
            </div>
          </div>
          <div className="min-w-0 lg:text-center">
            <div className="font-serif text-2xl font-bold italic leading-tight text-text lg:text-3xl">{t(`pawn.${selected}` as MessageKey)}</div>
            <p className="mt-1 text-xs text-text2 lg:text-sm">{t("pawn.hint")}</p>
          </div>
        </section>

        <section className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-line bg-bg2/40 p-2 lg:p-4" aria-label={t("pawn.grid")}>
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6">
            {pawns.map(pawn => {
              const owner = takenBy(pawn.id);
              const isSelected = pawn.id === selected;
              return (
                <li key={pawn.id}>
                  <button
                    type="button"
                    disabled={owner >= 0}
                    onClick={() => {
                      play("click");
                      setSelected(pawn.id);
                    }}
                    aria-pressed={isSelected}
                    aria-label={owner >= 0 ? t("pawn.taken", { pawn: t(`pawn.${pawn.id}` as MessageKey), name: seats[owner]?.name ?? "" }) : t(`pawn.${pawn.id}` as MessageKey)}
                    data-pawn={pawn.id}
                    className={`relative flex aspect-square w-full flex-col items-center justify-center rounded-2xl border transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${isSelected ? "border-gold bg-gold/10" : "border-line2 bg-bg3 hover:border-gold/60"}`}
                  >
                    <PawnShape index={seatIndex} pawn={pawn.id} size={44} color={owner >= 0 ? playerColors[owner] : color} />
                    {isSelected && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-bg">
                        <Check size={12} strokeWidth={3} aria-hidden />
                      </span>
                    )}
                    {owner >= 0 && <span className="absolute inset-x-1 bottom-1 truncate text-center font-mono text-[9px] text-text2">{seats[owner]?.name}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-3 flex items-center gap-3 lg:mt-6">
        {seats.some(seat => seat.isBot) && (
          <p className="hidden flex-1 items-center gap-1.5 text-xs text-text3 sm:flex">
            <Bot size={14} strokeWidth={iconStroke} aria-hidden />
            {t("pawn.robots")}
          </p>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={confirm}
          data-testid="pawn-confirm"
          className="ml-auto flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gold px-6 font-serif text-xl font-bold italic text-bg shadow-[0_16px_40px_-14px_rgba(240,168,50,0.9)] hover:bg-gold2 sm:w-auto"
        >
          {step + 1 < humans.length ? <Check size={20} strokeWidth={2.4} aria-hidden /> : <Play size={20} strokeWidth={2.2} fill="currentColor" aria-hidden />}
          {step + 1 < humans.length ? t("pawn.next") : t("pawn.start")}
        </motion.button>
      </div>
    </main>
  );
}
