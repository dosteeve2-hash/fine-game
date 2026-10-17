"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import configs from "../../data/config.json";
import type { GameConfig, GameMode } from "../../engine";
import { locales, useI18n, type Locale } from "../i18n";
import { playerColors } from "../theme";
import type { Seat } from "../useGame";

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
    { name: "", isBot: false, botLevel: 2 },
    { name: "", isBot: true, botLevel: 2 },
    { name: "", isBot: true, botLevel: 2 },
    { name: "", isBot: true, botLevel: 2 }
  ]);
  const [count, setCount] = useState(2);

  const config = allConfigs[mode];
  const update = (index: number, patch: Partial<Seat>) => setSeats(previous => previous.map((seat, i) => (i === index ? { ...seat, ...patch } : seat)));

  const submit = () => {
    const active = seats.slice(0, count).map((seat, index) => ({
      ...seat,
      name: seat.name.trim() || (seat.isBot ? `Bot ${index + 1}` : t("setup.player", { n: index + 1 }))
    }));
    onStart(config, active);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-10 pt-8">
      <header className="text-center">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-5xl italic font-black text-gold">
          FINE
        </motion.h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-text3">Financial Education Game</p>
        <p className="mt-3 font-serif text-lg italic text-text2">{t("app.tagline")}</p>
      </header>

      <div className="flex justify-center gap-1.5" role="group" aria-label={t("setup.language")}>
        {locales.map((code: Locale) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            className={`min-h-9 rounded-lg border px-3 font-mono text-xs uppercase ${locale === code ? "border-gold bg-gold text-bg" : "border-line2 text-text2"}`}
          >
            {code}
          </button>
        ))}
      </div>

      {hasSave && (
        <button type="button" onClick={onResume} className="min-h-12 rounded-xl border border-cyan px-4 text-sm font-medium text-cyan">
          {t("setup.resume")}
        </button>
      )}

      <section aria-labelledby="players-title">
        <h2 id="players-title" className="mb-2 font-mono text-[11px] uppercase tracking-wider text-text3">{t("setup.players")}</h2>
        <div className="mb-3 flex gap-2">
          {[2, 3, 4].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              aria-pressed={count === n}
              className={`min-h-11 flex-1 rounded-xl border font-mono text-sm ${count === n ? "border-gold bg-gold text-bg" : "border-line2 bg-bg3 text-text"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {seats.slice(0, count).map((seat, index) => (
            <div key={index} className="rounded-xl border border-line2 bg-bg3 p-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: playerColors[index] }} />
                <input
                  value={seat.name}
                  onChange={event => update(index, { name: event.target.value.slice(0, 14) })}
                  placeholder={seat.isBot ? `Bot ${index + 1}` : t("setup.namePlaceholder")}
                  aria-label={t("setup.player", { n: index + 1 })}
                  className="min-h-10 min-w-0 flex-1 rounded-lg border border-line2 bg-bg2 px-3 text-sm outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={() => update(index, { isBot: !seat.isBot })}
                  className="min-h-10 rounded-lg border border-line2 px-3 font-mono text-xs text-text2"
                >
                  {seat.isBot ? t("setup.bot") : t("setup.human")}
                </button>
              </div>
              {seat.isBot && (
                <div className="mt-2 flex gap-1.5" role="group" aria-label={t("setup.level")}>
                  {([1, 2, 3] as const).map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => update(index, { botLevel: level })}
                      aria-pressed={seat.botLevel === level}
                      className={`min-h-9 flex-1 rounded-lg border text-xs ${seat.botLevel === level ? "border-gold text-gold2" : "border-line2 text-text2"}`}
                    >
                      {t(`setup.level.${level}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="mode-title">
        <h2 id="mode-title" className="mb-2 font-mono text-[11px] uppercase tracking-wider text-text3">{t("setup.mode")}</h2>
        <div className="space-y-2">
          {modes.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              aria-pressed={mode === item}
              className={`min-h-12 w-full rounded-xl border px-4 text-left text-sm ${mode === item ? "border-gold bg-bg3 text-gold2" : "border-line2 bg-bg2 text-text2"}`}
            >
              {t(`setup.mode.${item}`)}
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-text3">{t("setup.goal", { target: config.freedomTarget, turns: config.freedomTurns })}</p>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={submit}
        className="min-h-14 rounded-2xl bg-gold px-6 font-serif text-xl italic font-bold text-bg"
      >
        {t("setup.start")}
      </motion.button>
    </main>
  );
}
