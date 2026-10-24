"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Download, Library, Play, RotateCcw, Share, User, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import configs from "../../data/config.json";
import type { GameConfig, GameMode } from "../../engine";
import { useAudio } from "../audio/AudioProvider";
import { isAppleTouch } from "../audio/engine";
import { locales, useI18n, type Locale } from "../i18n";
import { iconStroke } from "../icons";
import { useInstallPrompt } from "../install";
import { useProfile } from "../profile";
import { playerColors } from "../theme";
import type { Seat } from "../useGame";
import { ChapterProgress } from "./ChapterBubble";
import { CreditsSheet } from "./CreditsSheet";
import { Logo } from "./Logo";
import { Mascot } from "./Mascot";
import { PawnPicker, completePawns } from "./PawnPicker";
import { PawnShape } from "./Pawn";
import { SoundControl } from "./SoundControl";

interface Props {
  hasSave: boolean;
  onStart: (config: GameConfig, seats: Seat[]) => void;
  onResume: () => void;
}

const modes: GameMode[] = ["quick", "standard", "long"];
const allConfigs = configs as Record<GameMode, GameConfig>;

export function SetupScreen({ hasSave, onStart, onResume }: Props) {
  const { t, locale, setLocale } = useI18n();
  const [mode, setMode] = useState<GameMode>("standard");
  const [seats, setSeats] = useState<Seat[]>([
    { name: "", isBot: false, botLevel: 2, pawn: "" },
    { name: "", isBot: true, botLevel: 2, pawn: "" },
    { name: "", isBot: true, botLevel: 2, pawn: "" },
    { name: "", isBot: true, botLevel: 2, pawn: "" }
  ]);
  const [count, setCount] = useState(2);
  const [picking, setPicking] = useState<Seat[] | null>(null);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const config = allConfigs[mode];
  const { profile, ready, features, setExpert, seeHint } = useProfile();
  const { primed, muted } = useAudio();
  const { available, standalone, install } = useInstallPrompt();
  const [apple, setApple] = useState(false);
  const soundHint = ready && !profile.soundHint && !primed && !muted;
  const iosHint = ready && apple && !standalone && !profile.iosInstallHint && primed && profile.gamesPlayed > 0;
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    setApple(isAppleTouch());
  }, []);

  useEffect(() => {
    if (primed && ready && !profile.soundHint) seeHint("soundHint");
  }, [primed, ready, profile.soundHint, seeHint]);

  useEffect(() => {
    if (!iosHint) return;
    setIosOpen(true);
    seeHint("iosInstallHint");
  }, [iosHint, seeHint]);
  const update = (index: number, patch: Partial<Seat>) => setSeats(previous => previous.map((seat, i) => (i === index ? { ...seat, ...patch } : seat)));

  const submit = () => {
    const active = seats.slice(0, count).map((seat, index) => ({
      ...seat,
      name: seat.name.trim() || (seat.isBot ? `Robot ${index + 1}` : t("setup.player", { n: index + 1 }))
    }));
    if (active.some(seat => !seat.isBot)) setPicking(active);
    else onStart(config, completePawns(active, active.map(() => null)));
  };

  if (picking) {
    return <PawnPicker seats={picking} onBack={() => setPicking(null)} onDone={done => onStart(config, done)} />;
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] lg:flex-row lg:items-center lg:gap-16 lg:px-10">
      <div className="absolute right-4 top-[max(12px,env(safe-area-inset-top))] z-10 flex items-center gap-1">
        <div className="flex gap-1" role="group" aria-label={t("setup.language")}>
        {locales.map((code: Locale) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            className={`h-9 min-w-10 rounded-lg border px-2 font-mono text-[11px] uppercase transition-colors ${locale === code ? "border-gold bg-gold text-bg" : "border-line2 text-text2 hover:border-gold"}`}
          >
            {code}
          </button>
        ))}
        </div>
        <SoundControl />
      </div>

      <header className="flex flex-col items-center pt-14 text-center lg:flex-1 lg:items-start lg:pt-0 lg:text-left">
        <motion.div initial={{ scale: 0.6, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 14 }} className="lg:hidden">
          <Mascot size={96} mood="happy" label={t("mascot.label")} />
        </motion.div>
        <motion.div initial={{ scale: 0.6, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 14 }} className="hidden lg:block">
          <Mascot size={200} mood="happy" label={t("mascot.label")} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-2 lg:mt-6">
          <h1 className="sr-only">FINE Game</h1>
          <div className="lg:hidden">
            <Logo size={104} decorative priority />
          </div>
          <div className="hidden lg:block">
            <Logo size={168} decorative priority />
          </div>
        </motion.div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-text3 lg:text-xs">{t("setup.subtitle")}</p>
        <p className="mt-2 font-serif text-lg italic text-text2 lg:mt-4 lg:text-3xl">{t("app.tagline")}</p>
        <p className="mt-6 hidden max-w-md text-sm leading-relaxed text-text2 lg:block">{t("setup.goal")}</p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, type: "spring", stiffness: 140, damping: 20 }}
        className="mt-5 flex flex-col gap-3 lg:mt-0 lg:w-[440px] lg:rounded-3xl lg:border lg:border-line2 lg:bg-bg2/80 lg:p-6 lg:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
        aria-labelledby="setup-title"
      >
        <h2 id="setup-title" className="sr-only">{t("setup.title")}</h2>
        {hasSave && (
          <button type="button" onClick={onResume} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan/60 px-4 text-sm font-medium text-cyan hover:bg-cyan/10">
            <RotateCcw size={17} strokeWidth={iconStroke} aria-hidden />
            {t("setup.resume")}
          </button>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text3">{t("setup.players")}</span>
            <div className="flex gap-1" role="group" aria-label={t("setup.players")}>
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  aria-pressed={count === n}
                  className={`h-9 w-11 rounded-lg border font-mono text-sm transition-colors ${count === n ? "border-gold bg-gold text-bg" : "border-line2 bg-bg3 text-text hover:border-gold"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <ul className="space-y-1.5">
            {seats.slice(0, count).map((seat, index) => (
              <motion.li key={index} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 rounded-2xl border border-line2 bg-bg3 p-1.5 pl-2.5" style={{ boxShadow: `inset 3px 0 0 ${playerColors[index]}` }}>
                <PawnShape index={index} size={18} />
                <input
                  value={seat.name}
                  onChange={event => update(index, { name: event.target.value.slice(0, 14) })}
                  placeholder={seat.isBot ? `Robot ${index + 1}` : t("setup.namePlaceholder")}
                  aria-label={t("setup.player", { n: index + 1 })}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-transparent bg-bg2 px-3 text-sm outline-none placeholder:text-text3 focus:border-gold"
                />
                <button
                  type="button"
                  onClick={() => update(index, { isBot: !seat.isBot })}
                  aria-label={`${t("setup.toggleType")} : ${seat.isBot ? t("setup.bot") : t("setup.human")}`}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${seat.isBot ? "border-line2 text-text2" : "border-gold/60 text-gold2"}`}
                >
                  {seat.isBot ? <Bot size={18} strokeWidth={iconStroke} /> : <User size={18} strokeWidth={iconStroke} />}
                </button>
                {seat.isBot && (
                  <div className="flex shrink-0 gap-0.5" role="group" aria-label={t("setup.level")}>
                    {([1, 2, 3] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => update(index, { botLevel: level })}
                        aria-pressed={seat.botLevel === level}
                        aria-label={t("setup.seat.robot", { level })}
                        title={t(`setup.level.${level}`)}
                        className={`h-10 w-8 rounded-lg border font-mono text-xs transition-colors ${seat.botLevel === level ? "border-gold text-gold2" : "border-line2 text-text3"}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                )}
              </motion.li>
            ))}
          </ul>
        </div>

        <div>
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-text3">{t("setup.mode")}</span>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={t("setup.mode")}>
            {modes.map(item => {
              const [title, duration] = t(`setup.mode.${item}`).split(" · ");
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  aria-pressed={mode === item}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border px-1 transition-colors ${mode === item ? "border-gold bg-gold/10 text-gold2" : "border-line2 bg-bg3 text-text2 hover:border-gold"}`}
                >
                  <span className="text-sm font-medium">{title}</span>
                  {duration && <span className="font-mono text-[10px] opacity-75">{duration}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-text3 lg:hidden">{t("setup.goal")}</p>

        {ready && (
          <div className="rounded-2xl border border-line2 bg-bg3/70 px-3 py-2.5">
            <ChapterProgress chapter={features.chapter} />
            <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-between gap-3">
              <span className="text-sm text-text2">{t("chapter.expert")}</span>
              <input
                type="checkbox"
                role="switch"
                checked={profile.expert}
                onChange={event => setExpert(event.target.checked)}
                data-testid="expert-toggle"
                className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-line2 transition-colors before:block before:h-5 before:w-5 before:translate-x-0.5 before:translate-y-0.5 before:rounded-full before:bg-text2 before:transition-transform checked:bg-gold checked:before:translate-x-[22px] checked:before:bg-bg"
              />
            </label>
          </div>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={submit}
          className="mt-1 flex min-h-14 items-center justify-center gap-2.5 rounded-2xl bg-gold px-6 font-serif text-xl font-bold italic text-bg shadow-[0_16px_40px_-14px_rgba(240,168,50,0.9)] hover:bg-gold2"
        >
          <Play size={20} strokeWidth={2.2} fill="currentColor" aria-hidden />
          {t("setup.start")}
        </motion.button>
        {available && !standalone && (
          <button
            type="button"
            onClick={() => void install()}
            data-testid="install-button"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line2 bg-bg3 px-4 text-sm font-medium text-text hover:border-gold hover:text-gold2"
          >
            <Download size={17} strokeWidth={iconStroke} aria-hidden />
            {t("install.button")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setCreditsOpen(true)}
          className="mx-auto flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-text3 hover:text-gold2"
        >
          <Library size={14} strokeWidth={iconStroke} aria-hidden />
          {t("credits.title")}
        </button>
      </motion.section>
      <CreditsSheet open={creditsOpen} onClose={() => setCreditsOpen(false)} />
      <AnimatePresence>
        {soundHint && (
          <motion.p
            key="sound"
            className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+14px)] z-40 mx-auto flex w-max max-w-[90vw] items-center gap-2 rounded-full border border-line2 bg-bg2/95 px-4 py-2 text-[13px] text-text2 shadow-xl backdrop-blur"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.8 } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
            data-testid="sound-hint"
          >
            <Volume2 size={15} strokeWidth={iconStroke} className="text-gold2" aria-hidden />
            {t("audio.tapToEnable")}
          </motion.p>
        )}
        {iosOpen && (
          <motion.div
            key="ios"
            role="dialog"
            aria-label={t("install.iosTitle")}
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-40 mx-auto max-w-sm rounded-3xl border border-line2 bg-bg2/97 p-4 shadow-2xl backdrop-blur"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 1.2, type: "spring", stiffness: 240, damping: 26 } }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
            data-testid="ios-install"
          >
            <p className="font-serif text-lg font-bold italic text-text">{t("install.iosTitle")}</p>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm leading-snug text-text2">
              {t("install.iosStep1")}
              <Share size={16} strokeWidth={iconStroke} className="text-cyan" aria-hidden />
              {t("install.iosStep2")}
            </p>
            <button type="button" onClick={() => setIosOpen(false)} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-2xl border border-line2 bg-bg3 text-sm text-text hover:border-gold">
              {t("install.later")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
