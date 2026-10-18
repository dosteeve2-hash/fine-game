"use client";

import { Briefcase, CircleHelp, Keyboard, Library, LogOut, Menu, Receipt } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Action, GameState } from "../../engine";
import { useAudio } from "../audio/AudioProvider";
import { Board } from "../board/Board";
import { locales, useI18n } from "../i18n";
import { iconStroke } from "../icons";
import type { LogEntry, MoveRecord, Stage, StatementRecord } from "../useGame";
import { ActionBar, useActionModel } from "./Actions";
import { AssetControls, AssetsSheet } from "./AssetsSheet";
import { BoardCenter } from "./BoardCenter";
import { CardReveal } from "./CardReveal";
import { CoinLayer } from "./CoinLayer";
import { CreditsSheet } from "./CreditsSheet";
import { Fina } from "./Fina";
import { LogFeed } from "./LogFeed";
import { MoneyGuide, MoneyHistory } from "./MoneySheets";
import { Notices } from "./Notices";
import { PawnsProvider } from "./Pawn";
import { Players } from "./Players";
import { Scenes } from "./Scenes";
import { Sheet } from "./Sheet";
import { SoundControl } from "./SoundControl";
import { SpaceDetails } from "./SpaceDetails";
import { StatementCard, StatementView } from "./Statement";

interface Props {
  truth: GameState;
  view: GameState;
  stage: Stage;
  names: string[];
  pawns: string[];
  log: LogEntry[];
  ledger: MoveRecord[];
  statements: StatementRecord[];
  busy: boolean;
  thinking: boolean;
  onAct: (action: Action) => void;
  onLeave: () => void;
  onDismissCard: () => void;
  onDismissScene: () => void;
  onDismissStatement: () => void;
  onDismissNotice: (id: number) => void;
  onCoinsDone: (id: number) => void;
}

export function GameScreen({ truth, view, stage, names, pawns, log, ledger, statements, busy, thinking, onAct, onLeave, onDismissCard, onDismissScene, onDismissStatement, onDismissNotice, onCoinsDone }: Props) {
  const { t, d, locale, setLocale } = useI18n();
  const { toggleMute, play } = useAudio();
  const [menu, setMenu] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [spaceSheet, setSpaceSheet] = useState<number | null>(null);
  const [historyFor, setHistoryFor] = useState<number | null>(null);
  const [guideFor, setGuideFor] = useState<number | null>(null);
  const [statementSheet, setStatementSheet] = useState(false);
  const [sideTab, setSideTab] = useState<"log" | "statement">("log");
  const current = truth.players[truth.currentPlayerIndex];
  const humanTurn = Boolean(current && !current.isBot);
  const model = useActionModel(truth);
  const disabled = busy || !humanTurn;
  const canAct = humanTurn && !busy;
  const round = Math.floor(view.turn / view.players.length) + 1;
  const lastHuman = [...statements].reverse().find(item => view.players.find(player => player.id === item.playerId)?.isBot === false);
  const firstHuman = Math.max(0, view.players.findIndex(player => !player.isBot));
  const viewerId = humanTurn ? current?.id : (lastHuman?.playerId ?? view.players[firstHuman]?.id);
  const viewerIndex = Math.max(0, view.players.findIndex(player => player.id === viewerId));
  const shownStatement = [...statements].reverse().find(item => item.playerId === viewerId) ?? null;
  const cardStatement = stage.statement !== null ? statements.find(item => item.id === stage.statement) ?? null : null;
  const anySheet = menu || assetsOpen || creditsOpen || spaceSheet !== null || historyFor !== null || guideFor !== null || statementSheet;
  const sheetSpace = spaceSheet !== null ? view.spaces[spaceSheet] : undefined;
  const sheetOwned = sheetSpace?.assetId ? truth.players[viewerIndex]?.assets.some(asset => asset.assetId === sheetSpace.assetId) : false;
  const spectator = !humanTurn ? t("spectator.watching", { name: names[truth.currentPlayerIndex] ?? "" }) : null;
  const status = humanTurn && busy ? (stage.dice?.rolling ? t("game.rolling") : t("game.wait")) : null;

  const act = useCallback((action: Action) => {
    play("click");
    onAct(action);
  }, [onAct, play]);

  useEffect(() => {
    if (stage.statement !== null) play("statement");
  }, [stage.statement, play]);

  const closeAll = useCallback(() => {
    setMenu(false);
    setAssetsOpen(false);
    setCreditsOpen(false);
    setSpaceSheet(null);
    setHistoryFor(null);
    setGuideFor(null);
    setStatementSheet(false);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "Escape") {
        if (stage.card) onDismissCard();
        if (stage.scene) onDismissScene();
        if (stage.statement !== null && !anySheet) onDismissStatement();
        closeAll();
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
        if (stage.scene) {
          onDismissScene();
          return;
        }
        if (anySheet || disabled || !model.primary) return;
        act(model.primary.action);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, anySheet, closeAll, disabled, model.primary, onDismissCard, onDismissScene, onDismissStatement, stage.card, stage.scene, stage.statement, toggleMute]);

  const header = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Fina size={30} mood={stage.mood === "celebrate" ? "celebrate" : "idle"} />
        <span className="font-serif text-2xl font-black italic leading-none text-gold">FINE</span>
      </div>
      <span className="ml-1 whitespace-nowrap rounded-md border border-line2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text2">{t("game.round", { n: round })}</span>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setStatementSheet(true)}
          aria-label={t("statement.open")}
          className="flex h-11 w-10 items-center justify-center rounded-xl border border-line2 text-text2 hover:border-gold hover:text-gold2 lg:hidden"
        >
          <Receipt size={18} strokeWidth={iconStroke} />
        </button>
        <button
          type="button"
          onClick={() => setGuideFor(viewerIndex)}
          aria-label={t("guide.open", { name: names[viewerIndex] ?? "" })}
          className="flex h-11 w-10 items-center justify-center rounded-xl border border-line2 text-text2 hover:border-gold hover:text-gold2 lg:hidden"
        >
          <CircleHelp size={18} strokeWidth={iconStroke} />
        </button>
        <SoundControl />
        <button type="button" onClick={() => setMenu(true)} aria-label={t("game.menu")} className="flex h-11 w-11 items-center justify-center rounded-xl border border-line2 text-text2 hover:border-gold hover:text-gold2">
          <Menu size={19} strokeWidth={iconStroke} />
        </button>
      </div>
    </div>
  );

  const bar = (
    <ActionBar
      model={model}
      disabled={disabled}
      status={status}
      spectator={spectator}
      assetCount={truth.players[viewerIndex]?.assets.length ?? 0}
      onAct={act}
      onAssets={() => {
        play("click");
        setAssetsOpen(true);
      }}
    />
  );

  return (
    <PawnsProvider pawns={pawns}>
      <main className={`flex h-dvh w-full flex-col overflow-hidden transition-[filter] duration-700 lg:flex-row ${spectator ? "spectating" : ""}`} data-spectator={spectator ? "true" : "false"}>
        <div className="shrink-0 px-3 pt-[max(8px,env(safe-area-inset-top))] lg:hidden">{header}</div>
        <div className="shrink-0 px-3 pt-2 lg:hidden">
          <Players state={view} names={names} ledger={ledger} onHistory={setHistoryFor} compact />
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
          <StatementCard statement={cardStatement} state={view} names={names} variant="sheet" onClose={onDismissStatement} />
        </section>

        <div className="shrink-0 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-1 lg:hidden">{bar}</div>

        <aside className="hidden h-dvh w-[380px] shrink-0 flex-col gap-4 border-l border-line bg-bg2/70 p-5 lg:flex xl:w-[420px]">
          {header}
          <Players state={view} names={names} ledger={ledger} onHistory={setHistoryFor} onGuide={setGuideFor} />
          {stage.focus !== null && !cardStatement && <SpaceDetails state={view} names={names} index={stage.focus} compact />}
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div role="tablist" aria-label={t("game.log")} className="mb-2 flex shrink-0 gap-1">
              {(["log", "statement"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`side-tab-${tab}`}
                  aria-selected={sideTab === tab}
                  aria-controls="side-panel"
                  onClick={() => setSideTab(tab)}
                  className={`min-h-9 flex-1 rounded-lg border font-mono text-[10px] uppercase tracking-[0.18em] ${sideTab === tab ? "border-gold bg-gold/10 text-gold2" : "border-line text-text3 hover:text-text2"}`}
                >
                  {tab === "log" ? t("game.log") : t("statement.tab")}
                </button>
              ))}
            </div>
            <div id="side-panel" role="tabpanel" aria-labelledby={`side-tab-${sideTab}`} className="min-h-0 flex-1 overflow-hidden">
              {sideTab === "log" ? (
                <LogFeed state={view} names={names} log={log} bare />
              ) : (
                <div className="h-full overflow-y-auto pr-1">
                  {shownStatement ? <StatementView statement={shownStatement} state={view} names={names} /> : <p className="text-sm text-text3">{t("statement.none")}</p>}
                </div>
              )}
            </div>
            <StatementCard statement={cardStatement} state={view} names={names} variant="side" onClose={onDismissStatement} />
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
        <Scenes scene={stage.scene} state={view} names={names} onClose={onDismissScene} />
        <AssetsSheet
          open={assetsOpen}
          state={truth}
          names={names}
          playerIndex={viewerIndex}
          canAct={canAct}
          onAct={act}
          onOpenSpace={index => {
            setAssetsOpen(false);
            setSpaceSheet(index);
          }}
          onClose={() => setAssetsOpen(false)}
        />
        <MoneyHistory open={historyFor !== null} playerIndex={historyFor} ledger={ledger} state={view} names={names} onClose={() => setHistoryFor(null)} />
        <MoneyGuide open={guideFor !== null} playerIndex={guideFor} state={view} names={names} onClose={() => setGuideFor(null)} />
        <CreditsSheet open={creditsOpen} onClose={() => setCreditsOpen(false)} />

        <Sheet open={statementSheet} title={t("statement.title")} onClose={() => setStatementSheet(false)}>
          <div className="space-y-3 pb-3">
            {shownStatement ? <StatementView statement={shownStatement} state={view} names={names} /> : <p className="text-sm text-text3">{t("statement.none")}</p>}
            <button
              type="button"
              onClick={() => {
                setStatementSheet(false);
                setGuideFor(viewerIndex);
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line2 bg-bg3 text-sm text-text hover:border-gold hover:text-gold2"
            >
              <CircleHelp size={17} strokeWidth={iconStroke} aria-hidden />
              {t("guide.title")}
            </button>
          </div>
        </Sheet>

        <Sheet open={spaceSheet !== null} title={sheetSpace ? d(sheetSpace.titleKey) : ""} onClose={() => setSpaceSheet(null)}>
          {spaceSheet !== null && (
            <div className="space-y-3 pb-3">
              <SpaceDetails state={view} names={names} index={spaceSheet} />
              {sheetOwned && sheetSpace?.assetId && (
                <div className="space-y-2" data-testid="deed-manage">
                  <AssetControls state={truth} playerIndex={viewerIndex} assetId={sheetSpace.assetId} canAct={canAct} onAct={act} />
                  <button
                    type="button"
                    onClick={() => {
                      setSpaceSheet(null);
                      setAssetsOpen(true);
                    }}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line2 bg-bg3 text-sm text-text2 hover:border-gold hover:text-gold2"
                  >
                    <Briefcase size={16} strokeWidth={iconStroke} aria-hidden />
                    {t("assets.openAll")}
                  </button>
                </div>
              )}
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
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                setCreditsOpen(true);
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line2 bg-bg3 text-sm text-text hover:border-gold hover:text-gold2"
            >
              <Library size={17} strokeWidth={iconStroke} aria-hidden />
              {t("credits.title")}
            </button>
            <button type="button" onClick={onLeave} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line2 bg-bg3 text-sm text-text hover:border-red hover:text-red">
              <LogOut size={17} strokeWidth={iconStroke} aria-hidden />
              {t("game.leave")}
            </button>
            <p className="text-center text-xs text-text3">{t("game.leaveHint")}</p>
          </div>
        </Sheet>
      </main>
    </PawnsProvider>
  );
}
