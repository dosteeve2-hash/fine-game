"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Music, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAudio } from "../audio/AudioProvider";
import { isAppleTouch, type AudioStatus } from "../audio/engine";
import { useI18n } from "../i18n";
import { iconStroke } from "../icons";

export function SoundControl() {
  const { t } = useI18n();
  const { muted, music, volume, musicVolume, sfxVolume, status, test, toggleMute, toggleMusic, setVolume, setMusicVolume, setSfxVolume } = useAudio();
  const [open, setOpen] = useState(false);
  const [tested, setTested] = useState<AudioStatus | null>(null);
  const shown = tested ?? status;
  const runTest = () => {
    setTested(null);
    void test().then(setTested);
  };
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-label={t("audio.settings")}
        data-testid="sound-button"
        className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${muted ? "border-red/40 text-red" : "border-line2 text-text2 hover:border-gold hover:text-gold2"}`}
      >
        {muted ? <VolumeX size={19} strokeWidth={iconStroke} /> : <Volume2 size={19} strokeWidth={iconStroke} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 z-50 w-[min(16rem,calc(100vw-2rem))] rounded-2xl border border-line2 bg-bg2 p-3 shadow-2xl"
            role="dialog"
            aria-label={t("audio.settings")}
          >
            <button
              type="button"
              onClick={runTest}
              data-testid="sound-test"
              className="mb-2 flex min-h-11 w-full items-center gap-2 rounded-xl border border-gold/50 px-3 text-sm font-medium text-gold2 hover:bg-gold/10"
            >
              <BellRing size={18} strokeWidth={iconStroke} aria-hidden />
              {t("audio.test")}
              <span data-testid="sound-status" className={`ml-auto font-mono text-[11px] ${shown === "ready" ? "text-green" : "text-text3"}`}>
                {t(`audio.status.${shown}`)}
              </span>
            </button>
            {tested !== null && tested !== "unsupported" && (
              <p className="mb-2 px-1 text-[12px] leading-snug text-text2" aria-live="polite">
                {tested === "ready" ? (isAppleTouch() ? t("audio.tipSilent") : t("audio.tipVolume")) : t("audio.tipLocked")}
              </p>
            )}
            <button
              type="button"
              onClick={toggleMute}
              aria-pressed={muted}
              data-testid="mute-toggle"
              className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium ${muted ? "bg-gold text-bg" : "bg-bg3 text-text hover:bg-line2"}`}
            >
              {muted ? <Volume2 size={18} strokeWidth={iconStroke} aria-hidden /> : <VolumeX size={18} strokeWidth={iconStroke} aria-hidden />}
              {muted ? t("audio.unmute") : t("audio.mute")}
              <kbd className="ml-auto font-mono text-[10px] opacity-60">M</kbd>
            </button>
            <button
              type="button"
              onClick={toggleMusic}
              aria-pressed={music}
              className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl bg-bg3 px-3 text-sm text-text hover:bg-line2"
            >
              <Music size={18} strokeWidth={iconStroke} aria-hidden />
              {t("audio.music")}
              <span className={`ml-auto font-mono text-[11px] ${music ? "text-green" : "text-text3"}`}>{music ? t("audio.on") : t("audio.off")}</span>
            </button>
            <label className="mt-3 block px-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text3">{t("audio.volume")}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={event => setVolume(Number(event.target.value) / 100)}
                className="mt-1 w-full accent-[#f0a832]"
              />
            </label>
            <label className="mt-2 block px-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text3">{t("audio.musicVolume")}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(musicVolume * 100)}
                onChange={event => setMusicVolume(Number(event.target.value) / 100)}
                className="mt-1 w-full accent-[#f0a832]"
              />
            </label>
            <label className="mt-2 block px-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text3">{t("audio.sfxVolume")}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(sfxVolume * 100)}
                onChange={event => setSfxVolume(Number(event.target.value) / 100)}
                className="mt-1 w-full accent-[#f0a832]"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
