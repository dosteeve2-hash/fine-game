"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info, Lightbulb, ShieldCheck, X } from "lucide-react";
import { ArtIcon } from "../art";
import { useEffect, useState } from "react";
import type { GameState } from "../../engine";
import { audio } from "../audio/engine";
import { iconStroke } from "../icons";
import { cardPrefix, findCard, useText } from "../text";
import type { CardShow } from "../useGame";

interface Props {
  card: CardShow | null;
  state: GameState;
  names: string[];
  onClose: () => void;
}

function CardBack() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[22px] border border-gold/60 bg-[#20204a]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
      <svg viewBox="0 0 200 290" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
        <defs>
          <pattern id="card-weave" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 10h20M10 0v20" stroke="#f2a900" strokeOpacity="0.16" strokeWidth="1" />
            <circle cx="10" cy="10" r="1.6" fill="#f2a900" fillOpacity="0.28" />
          </pattern>
          <radialGradient id="card-glow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#f2a900" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f2a900" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="200" height="290" fill="url(#card-weave)" />
        <rect width="200" height="290" fill="url(#card-glow)" />
        <rect x="10" y="10" width="180" height="270" rx="16" fill="none" stroke="#f2a900" strokeOpacity="0.55" strokeWidth="1.2" />
        <rect x="16" y="16" width="168" height="258" rx="12" fill="none" stroke="#f2a900" strokeOpacity="0.2" strokeWidth="1" />
        <circle cx="100" cy="140" r="42" fill="#20204a" stroke="#f2a900" strokeWidth="1.6" />
        <circle cx="100" cy="140" r="35" fill="none" stroke="#f7c060" strokeOpacity="0.4" strokeDasharray="2 3" />
        <text x="100" y="156" textAnchor="middle" fontFamily="var(--font-lilita), sans-serif" fontWeight="400" fontSize="46" fill="#f2a900">F</text>
        <text x="100" y="236" textAnchor="middle" fontFamily="var(--font-jetbrains), monospace" fontSize="10" letterSpacing="5" fill="#f7c060" fillOpacity="0.8">FINE</text>
      </svg>
    </div>
  );
}

export function CardReveal({ card, state, names, onClose }: Props) {
  const { t, d, money, effectLine } = useText();
  const reduced = Boolean(useReducedMotion());
  const [flipped, setFlipped] = useState(false);
  const [info, setInfo] = useState(false);

  useEffect(() => {
    if (!card) return;
    setFlipped(false);
    setInfo(false);
    const timer = window.setTimeout(() => {
      setFlipped(true);
      audio.play(card.deck === "opportunity" ? "cardOpportunity" : card.amount < 0 ? "cardEvent" : "cardFlip");
    }, reduced ? 120 : 520);
    return () => window.clearTimeout(timer);
  }, [card, reduced]);

  const found = card ? findCard(card.cardId) : null;
  const prefix = card ? cardPrefix(card.cardId) : "";
  const isOpportunity = card?.deck === "opportunity";
  const tone = isOpportunity ? "#68bf93" : card && card.amount < 0 ? "#e8877c" : "#f2a900";
  const deckArt = isOpportunity ? "game-icons:open-treasure-chest" : "game-icons:card-random";
  const effect = found ? effectLine(found.card.effect) : null;
  const base = found?.card.effect.type === "cash" ? found.card.effect.amount ?? 0 : 0;
  const saved = card && base < 0 && card.amount > base ? card.amount - base : 0;
  const player = card ? state.players[card.player] : undefined;

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key={card.id}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060f]/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={d(`${prefix}.title`)}
        >
          <motion.div
            className="relative"
            style={{ width: "min(330px, 86vw)", aspectRatio: "200 / 272", perspective: 1400 }}
            initial={{ y: 60, scale: 0.85, rotate: -4 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            exit={{ y: 40, scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 210, damping: 22 }}
            onClick={event => event.stopPropagation()}
          >
            <motion.div
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d" }}
              initial={{ rotateY: 180 }}
              animate={{ rotateY: flipped ? 0 : 180 }}
              transition={{ duration: reduced ? 0.15 : 0.7, ease: [0.3, 0.7, 0.2, 1] }}
            >
              <div className="absolute inset-0 flex flex-col overflow-hidden rounded-[22px] border bg-[#fffaf0] text-[#20204a] shadow-[0_30px_80px_-20px_rgba(32,32,74,0.5)]" style={{ backfaceVisibility: "hidden", borderColor: tone }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ background: tone }}>
                  <ArtIcon name={deckArt} size={18} color="#20204a" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#20204a]">{isOpportunity ? t("card.opportunity") : t("card.event")}</span>
                  <span className="ml-auto truncate font-mono text-[10px] text-[#20204a]/75">{player ? t("card.for", { name: names[card.player] ?? "" }) : ""}</span>
                </div>
                <div className="relative flex flex-1 flex-col overflow-hidden px-5 pb-4 pt-4">
                  <ArtIcon name={deckArt} size={190} color={tone} className="pointer-events-none absolute -right-10 top-24 opacity-[0.12]" />
                  <h2 className="font-serif text-[28px] font-black italic leading-[1.05]">{d(`${prefix}.title`)}</h2>
                  {card.amount !== 0 && found?.card.effect.type === "cash" && (
                    <div className={`mt-4 self-start rounded-xl px-3 py-1.5 font-mono text-3xl font-semibold ${card.amount > 0 ? "bg-[#24734d]/15 text-[#17704a]" : "bg-[#a83c38]/12 text-[#8f292b]"}`}>
                      {card.amount > 0 ? "+" : "−"}
                      {money(Math.abs(card.amount))}
                    </div>
                  )}
                  {effect &&                   <div className="mt-3 self-start rounded-xl bg-[#20204a]/8 px-3 py-1.5 font-mono text-[13px] font-semibold">{effect}</div>}
                  {saved > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[#17704a]">
                      <ShieldCheck size={16} strokeWidth={iconStroke} aria-hidden />
                      {t("card.insured", { amount: money(saved) })}
                    </div>
                  )}
                  <div className="relative mt-auto">
                    <AnimatePresence initial={false} mode="wait">
                      {info ? (
                        <motion.div
                          key="tip"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.18 }}
                          className="rounded-2xl border border-[#785000]/30 bg-[#fffaf0] p-3"
                          data-testid="card-tip"
                        >
                          <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#785000]">
                            <Lightbulb size={14} strokeWidth={iconStroke} aria-hidden />
                            {t("card.realLife")}
                            <button type="button" onClick={() => setInfo(false)} aria-label={t("card.infoClose")} className="-my-2 -mr-2 ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#785000]">
                              <X size={15} strokeWidth={iconStroke} aria-hidden />
                            </button>
                          </div>
                          <p className="mt-0.5 text-[13px] leading-snug text-[#55536d]">{d(`${prefix}.text`)}</p>
                          <p className="mt-1 text-[13px] leading-snug text-[#55536d]">{d(`${prefix}.tip`)}</p>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="info"
                          type="button"
                          onClick={() => setInfo(true)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          aria-label={t("card.info")}
                          aria-expanded={false}
                          data-testid="card-info"
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#785000]/40 bg-[#fffaf0] text-[#785000]"
                        >
                          <Info size={20} strokeWidth={iconStroke} aria-hidden />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <CardBack />
            </motion.div>
            <motion.button
              type="button"
              onClick={onClose}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 10 }}
              transition={{ delay: reduced ? 0 : 0.5 }}
              className="absolute -bottom-16 left-1/2 flex min-h-12 min-w-44 -translate-x-1/2 items-center justify-center overflow-hidden rounded-2xl bg-gold px-6 font-medium text-bg shadow-[0_10px_30px_-10px_rgba(240,168,50,0.7)]"
            >
              {card.auto && !reduced && (
                <motion.span className="absolute inset-y-0 left-0 bg-gold2" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.8, ease: "linear" }} aria-hidden />
              )}
              <span className="relative">{t("card.continue")}</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
