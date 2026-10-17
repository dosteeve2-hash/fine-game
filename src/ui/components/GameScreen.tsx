"use client";

import { Keyboard, LogOut, Menu } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Action, GameState } from "../../engine";
import { useAudio } from "../audio/AudioProvider";
import { Board } from "../board/Board";
import { locales, useI18n } from "../i18n";
import { iconStroke } from "../icons";
import type { LogEntry, Stage } from "../useGame";
import { ActionBar, FinanceSheet, useActionModel } from "./Actions";
import { BoardCenter } from "./BoardCenter";
import { CardReveal } from "./CardReveal";
import { CoinLayer } from "./CoinLayer";
import { Fino } from "./Fino";
import { LogFeed } from "./LogFeed";
import { Notices } from "./Notices";
import { Players } from "./Players";
import { Sheet } from "./Sheet";
import { SoundControl } from "./SoundControl";
import { SpaceDetails } from "./SpaceDetails";

interface Props {
  truth: GameState;
  view: GameState;
  stage: Stage;
  names: string[];
  log: LogEntry[];
  busy: boolean;
  thinking: boolean;
  onAct: (action: Action) => void;
  onLeave: () => void;
  onDismissCard: () => void;
  onDismissNotice: (id: number) => void;
  onCoinsDone: (id: number) => void;
}

export function GameScreen({ truth, view, stage, names, log, busy, thinking, onAct, onLeave, onDismissCard, onDismissNotice, onCoinsDone }: Props) {
  const { t, d, locale, setLocale } = useI18n();
  const { toggleMute, play } = useAudio();
  const [menu, setMenu] = useState(false);
  const [finances, setFinances] = useState(false);
  const [spaceSheet, setSpaceSheet] = useState<number | null>(null);
  const current = truth.players[truth.currentPlayerIndex];
  const humanTurn = Boolean(current && !current.isBot);
  const model = useActionModel(truth);
  const disabled = busy || !humanTurn;
  const round = Math.floor(view.turn / view.players.length) + 1;
  const sheetSpace = spaceSheet !== null ? view.spaces[spaceSheet] : undefined;
  const status = !humanTurn
    ? t("game.thinking", { name: names[truth.currentPlayerIndex] ?? "" })
    : busy
      ? stage.dice?.rolling
        ? t("game.rolling")
        : t("game.wait")
      : null;

  const act = useCallback((action: Action) => {
    play("click");
    onAct(action);
  }, [onAct, play]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "Escape") {
        if (stage.card) onDismissCard();
        setMenu(false);
        setFinances(false);
        setSpaceSheet(null);
        return;
      }
      if (event.key === "m" || event.key === "M") {
        toggleMute();
        return;
      }
      if (event.key === " " || event.code === "Space") {
        if (target?.tagName === "BUTTON" && !target.hasAttribute("data-primary-action")) return;
        event.preventDefault();
        if (stage.card) {
          onDismissCard();
          return;
        }
        if (menu || finances || spaceSheet !== null || disabled || !model.primary) return;
        act(model.primary.action);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, disabled, finances, menu, model.primary, onDismissCard, spaceSheet, stage.card, toggleMute]);

  const header = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Fino size={28} mood={stage.mood === "celebrate" ? "celebrate" : "idle"} />
        <span className="font-serif text-2xl font-black italic leading-none text-gold">FINE</span>
      </div>
      <span className="ml-1 rounded-md border border-line2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text2">{t("game.round", { n: round })}</span>
      <div className="ml-auto flex items-center gap-2">
        <SoundControl />
        <button type="button" onClick={() => setMenu(true)} aria-label={t("game.menu")} className="flex h-11 w-11 items-center justify-center rounded-xl border border-line2 text-text2 hover:border-gold hover:text-gold2">
          <Menu size={19} strokeWidth={iconStroke} />
        </button>
      </div>
    </div>
  );

  const bar = <ActionBar model={model} disabled={disabled} status={status} onAct={act} onFinances={() => setFinances(true)} />;

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden lg:flex-row">
      <div className="shrink-0 px-3 pt-[max(8px,env(safe-area-inset-top))] lg:hidden">{header}</div>
      <div className="shrink-0 px-3 pt-2 lg:hidden">
        <Players state={view} names={names} compact />
      </div>

      <section className="relative min-h-0 min-w-0 flex-1 p-2 lg:p-6 xl:p-8">
        <Board
          view={view}
          stage={stage}
          onOpenSpace={index => {
            play("click");
            setSpaceSheet(index);
          }}
          center={layout => <BoardCenter view={view} stage={stage} names={names} thinking={thinking} layout={layout} />}
        />
      </section>

      <div className="shrink-0 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-1 lg:hidden">{bar}</div>

      <aside className="hidden h-dvh w-[380px] shrink-0 flex-col gap-4 border-l border-line bg-bg2/70 p-5 lg:flex xl:w-[420px]">
        {header}
        <Players state={view} names={names} />
        {stage.focus !== null && <SpaceDetails state={view} names={names} index={stage.focus} compact />}
        <div className="min-h-0 flex-1 overflow-hidden">
          <LogFeed state={view} names={names} log={log} />
        </div>
        {bar}
        <p className="flex items-center gap-1.5 font-mono text-[10px] text-text3">
          <Keyboard size={12} strokeWidth={iconStroke} aria-hidden />
          {t("game.shortcuts")}
        </p>
      </aside>

      <Notices notices={stage.notices} state={view} names={names} onDismiss={onDismissNotice} />
      <CoinLayer coins={stage.coins} onDone={onCoinsDone} />
      <CardReveal card={stage.card} state={view} names={names} onClose={onDismissCard} />
      <FinanceSheet open={finances} model={model} disabled={disabled} onAct={act} onClose={() => setFinances(false)} />

      <Sheet open={spaceSheet !== null} title={sheetSpace ? d(sheetSpace.titleKey) : ""} onClose={() => setSpaceSheet(null)}>
        {spaceSheet !== null && (
          <div className="pb-3">
            <SpaceDetails state={view} names={names} index={spaceSheet} />
          </div>
        )}
      </Sheet>

      <Sheet open={menu} title={t("game.menu")} onClose={() => setMenu(false)}>
        <div className="space-y-4 pb-3">
          <div className="flex gap-1.5" role="group" aria-label={t("setup.language")}>
            {locales.map(code => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={locale === code}
                className={`min-h-11 flex-1 rounded-xl border font-mono text-xs uppercase ${locale === code ? "border-gold bg-gold text-bg" : "border-line2 text-text2"}`}
              >
                {code}
              </button>
            ))}
          </div>
          <div className="h-56 lg:hidden">
            <LogFeed state={view} names={names} log={log} limit={20} />
          </div>
          <button type="button" onClick={onLeave} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line2 bg-bg3 text-sm text-text hover:border-red hover:text-red">
            <LogOut size={17} strokeWidth={iconStroke} aria-hidden />
            {t("game.leave")}
          </button>
          <p className="text-center text-xs text-text3">{t("game.leaveHint")}</p>
        </div>
      </Sheet>
    </main>
  );
}
