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
    <main className="fine-home">
      <div className="home-topbar">
        <Logo size={36} variant="horizontal" priority />
        <div className="flex items-center gap-1">
          <div className="home-language" role="group" aria-label={t("setup.language")}>
            {locales.map((code: Locale) => (
              <button key={code} type="button" onClick={() => setLocale(code)} aria-pressed={locale === code}>
                {code}
              </button>
            ))}
          </div>
          <SoundControl />
        </div>
      </div>

      <div className="home-layout">
        <header className="home-intro">
          <div className="home-art" aria-hidden="true">
            <div className="home-art-mascot">
              <Mascot size={118} mood="happy" framed={false} />
            </div>
            <div className="home-coin-path">
              <img className="home-coin" src="/brand/mark.svg" width="52" height="52" alt="" />
              <span className="home-pawn">
                <PawnShape index={0} size={30} />
              </span>
            </div>
          </div>
          <h1 className="home-title">{t("home.headline")}</h1>
          <p className="home-tagline">{t("home.tagline")}</p>
          <ul className="home-facts" aria-label={t("home.factsLabel")}>
            <li>{t("home.offline")}</li>
            <li>{t("home.players")}</li>
            <li>{t("home.chapters")}</li>
            <li>{t("home.languages")}</li>
          </ul>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 140, damping: 20 }}
          className="home-panel"
          aria-labelledby="setup-title"
        >
          <h2 id="setup-title" className="home-panel-title">{t("setup.title")}</h2>
          {hasSave && (
            <button type="button" onClick={onResume} className="home-secondary mb-4 flex w-full items-center justify-center gap-2 px-4">
              <RotateCcw size={17} strokeWidth={iconStroke} aria-hidden />
              {t("setup.resume")}
            </button>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="home-field-label mb-0">{t("setup.players")}</span>
              <div className="home-count" role="group" aria-label={t("setup.players")}>
                {[2, 3, 4].map(n => (
                  <button key={n} type="button" onClick={() => setCount(n)} aria-pressed={count === n}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <ul className="m-0 list-none p-0">
              {seats.slice(0, count).map((seat, index) => (
                <motion.li
                  key={index}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="home-player-row"
                  style={{ boxShadow: `inset 3px 0 0 ${playerColors[index]}` }}
                >
                  <PawnShape index={index} size={18} />
                  <input
                    value={seat.name}
                    onChange={event => update(index, { name: event.target.value.slice(0, 14) })}
                    placeholder={seat.isBot ? `Robot ${index + 1}` : t("setup.namePlaceholder")}
                    aria-label={t("setup.player", { n: index + 1 })}
                  />
                  <button
                    type="button"
                    onClick={() => update(index, { isBot: !seat.isBot })}
                    aria-label={`${t("setup.toggleType")} : ${seat.isBot ? t("setup.bot") : t("setup.human")}`}
                    className="home-seat-button"
                    aria-pressed={seat.isBot}
                  >
                    {seat.isBot ? <Bot size={18} strokeWidth={iconStroke} aria-hidden /> : <User size={18} strokeWidth={iconStroke} aria-hidden />}
                  </button>
                  {seat.isBot && (
                    <div className="home-levels" role="group" aria-label={t("setup.level")}>
                      {([1, 2, 3] as const).map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => update(index, { botLevel: level })}
                          aria-pressed={seat.botLevel === level}
                          aria-label={t("setup.seat.robot", { level })}
                          title={t(`setup.level.${level}`)}
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

          <div className="mt-4">
            <span className="home-field-label">{t("setup.mode")}</span>
            <div className="home-modes" role="group" aria-label={t("setup.mode")}>
              {modes.map(item => {
                const [title, duration] = t(`setup.mode.${item}`).split(" · ");
                return (
                  <button key={item} type="button" onClick={() => setMode(item)} aria-pressed={mode === item} className="flex flex-col items-center justify-center px-1">
                    <span>{title}</span>
                    {duration && <span>{duration}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-text2">{t("setup.goal")}</p>

          {ready && (
            <div className="mt-3 rounded-2xl border border-line2 bg-bg3 px-3 py-2.5">
              <ChapterProgress chapter={features.chapter} />
              <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-between gap-3">
                <span className="text-sm text-text2">{t("chapter.expert")}</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={profile.expert}
                  onChange={event => setExpert(event.target.checked)}
                  data-testid="expert-toggle"
                  className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-line2 transition-colors before:block before:h-5 before:w-5 before:translate-x-0.5 before:translate-y-0.5 before:rounded-full before:bg-text2 before:transition-transform checked:bg-gold checked:before:translate-x-[22px] checked:before:bg-text"
                />
              </label>
            </div>
          )}

          <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={submit} className="home-primary mt-4 flex items-center justify-center gap-2.5 px-6">
            <Play size={19} strokeWidth={2.2} fill="currentColor" aria-hidden />
            {t("setup.start")}
          </motion.button>
          {available && !standalone && (
            <button type="button" onClick={() => void install()} data-testid="install-button" className="home-secondary mt-3 flex w-full items-center justify-center gap-2 px-4">
              <Download size={17} strokeWidth={iconStroke} aria-hidden />
              {t("install.button")}
            </button>
          )}
          <button type="button" onClick={() => setCreditsOpen(true)} className="mx-auto mt-1 flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm text-text2 hover:text-text">
            <Library size={15} strokeWidth={iconStroke} aria-hidden />
            {t("credits.title")}
          </button>
        </motion.section>
      </div>

      <footer className="home-footer">
        <Logo size={24} variant="horizontal" decorative />
        <span>{t("home.footer")}</span>
        <a href="mailto:docompaore2@gmail.com">docompaore2@gmail.com</a>
      </footer>
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
