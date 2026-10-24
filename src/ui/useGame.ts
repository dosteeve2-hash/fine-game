"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import configs from "../data/config.json";
import { applyAction, auditOffice, chooseBotAction, createGame } from "../engine";
import type { Action, GameConfig, GameEvent, GameMode, GameState } from "../engine";
import { explainAction, openingStatement } from "../engine/ledger";
import type { Explanation, LogEvent, MoneyMove, Statement } from "../engine/ledger";
import { pawnDef } from "./art/pawns";
import { audio } from "./audio/engine";
import type { MascotMood } from "./components/Mascot";
import { haptic } from "./haptics";
import { chapterOf, useProfile } from "./profile";
import { findCard } from "./text";

export interface LogEntry {
  id: number;
  event: LogEvent;
}

export interface MoveRecord extends MoneyMove {
  id: number;
}

export interface StatementRecord extends Statement {
  id: number;
}

export interface Seat {
  name: string;
  isBot: boolean;
  botLevel: 1 | 2 | 3;
  pawn: string;
}

export interface Notice {
  id: number;
  event: LogEvent;
  owner?: number;
}

export interface CardShow {
  id: number;
  cardId: string;
  deck: "event" | "opportunity";
  amount: number;
  player: number;
  auto: boolean;
}

export type SceneKind = "salary" | "tax" | "bank" | "circle" | "rest" | "audit" | "auditExit" | "restart";

export type SceneVariant = "full" | "brief" | "locked";

export interface SceneShow {
  id: number;
  kind: SceneKind;
  player: number;
  amount?: number;
  blocking: boolean;
  variant: SceneVariant;
  /** Chapter that unlocks the feature behind this space (variant "locked"). */
  chapter?: number;
}

export type Anchor = { player: number } | { space: number };

export interface CoinFlight {
  id: number;
  from: Anchor;
  to: Anchor;
  count: number;
}

export interface Stage {
  dice: { values: [number, number]; rolling: boolean } | null;
  hop: { player: number; position: number; jump?: boolean } | null;
  pulse: { space: number; key: number } | null;
  banner: { player: number; key: number; human: boolean } | null;
  card: CardShow | null;
  scene: SceneShow | null;
  shake: number;
  notices: Notice[];
  coins: CoinFlight[];
  mood: MascotMood;
  focus: number | null;
  statement: number | null;
}

interface Saved {
  state: GameState;
  names: string[];
  pawns?: string[];
  log: LogEntry[];
  nextId: number;
  ledger?: MoveRecord[];
  statements?: StatementRecord[];
  gameId?: number;
}

const saveKey = "fine.save.v1";
const logLimit = 80;
const ledgerLimit = 300;
const statementLimit = 40;
const emptyStage: Stage = { dice: null, hop: null, pulse: null, banner: null, card: null, scene: null, shake: 0, notices: [], coins: [], mood: "idle", focus: null, statement: null };
const normalTiming = { dice: 1350, slow: 420, settle: 360, hop: 235, land: 380, banner: 1500, after: 420, coin: 700, card: 3000, bot: 1300, scene: 1650, brief: 750, locked: 1100, jump: 900 };
const reducedTiming = { dice: 450, slow: 120, settle: 120, hop: 110, land: 200, banner: 900, after: 250, coin: 300, card: 2200, bot: 600, scene: 900, brief: 500, locked: 800, jump: 250 };

const noticeTypes = new Set([
  "start.salary",
  "tax.paid",
  "rent.paid",
  "asset.bought",
  "asset.sold",
  "asset.forced_sale",
  "loan.taken",
  "loan.repaid",
  "loan.defaulted",
  "insurance.bought",
  "circle.joined",
  "circle.default",
  "circle.payout",
  "circle.contribution",
  "player.restarted",
  "trade.completed",
  "audit.sent",
  "audit.paid",
  "audit.waited",
  "audit.released"
]);

const modeConfigs = configs as Record<GameMode, GameConfig>;

function normalize(state: GameState): GameState {
  const defaults = modeConfigs[state.config.mode] ?? modeConfigs.standard;
  return {
    ...state,
    config: { ...state.config, auditFee: state.config.auditFee ?? defaults.auditFee, auditTurns: state.config.auditTurns ?? defaults.auditTurns },
    players: state.players.map(player => ({ ...player, auditTurns: player.auditTurns ?? 0 }))
  };
}

function readSave(): Saved | null {
  try {
    const raw = window.localStorage.getItem(saveKey);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    return { ...saved, state: normalize(saved.state) };
  } catch {
    return null;
  }
}

function writeSave(saved: Saved | null) {
  try {
    if (saved) window.localStorage.setItem(saveKey, JSON.stringify(saved));
    else window.localStorage.removeItem(saveKey);
  } catch {
    return;
  }
}

function splitDice(total: number): [number, number] {
  const first = Math.max(1, Math.min(6, Math.ceil(total / 2)));
  return [first, Math.max(1, total - first)];
}

export function useGame() {
  const reduced = Boolean(useReducedMotion());
  const [truth, setTruth] = useState<GameState | null>(null);
  const [view, setView] = useState<GameState | null>(null);
  const [stage, setStage] = useState<Stage>(emptyStage);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [pawns, setPawns] = useState<string[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [ledger, setLedger] = useState<MoveRecord[]>([]);
  const [statements, setStatements] = useState<StatementRecord[]>([]);
  const [hasSave, setHasSave] = useState(false);
  const [gameId, setGameId] = useState(0);
  const { features, firstScene } = useProfile();
  const featuresRef = useRef(features);
  const firstSceneRef = useRef(firstScene);
  featuresRef.current = features;
  firstSceneRef.current = firstScene;
  const nextId = useRef(1);
  const truthRef = useRef<GameState | null>(null);
  const pawnsRef = useRef<string[]>([]);
  const busyRef = useRef(false);
  const generation = useRef(0);
  const cardResolver = useRef<(() => void) | null>(null);
  const sceneResolver = useRef<(() => void) | null>(null);
  const moodTimer = useRef(0);
  const timing = useRef(normalTiming);

  useEffect(() => {
    timing.current = reduced ? reducedTiming : normalTiming;
  }, [reduced]);

  useEffect(() => {
    setHasSave(readSave() !== null);
  }, []);

  const patch = useCallback((update: Partial<Stage> | ((stage: Stage) => Partial<Stage>)) => {
    setStage(previous => ({ ...previous, ...(typeof update === "function" ? update(previous) : update) }));
  }, []);

  const setMood = useCallback((mood: MascotMood, hold = 2600) => {
    window.clearTimeout(moodTimer.current);
    patch({ mood });
    if (mood !== "idle" && hold > 0) moodTimer.current = window.setTimeout(() => patch({ mood: "idle" }), hold);
  }, [patch]);

  const notify = useCallback((event: LogEvent, owner?: number) => {
    const notice: Notice = { id: nextId.current++, event, ...(owner === undefined ? {} : { owner }) };
    patch(previous => ({ notices: [...previous.notices, notice].slice(-1) }));
  }, [patch]);

  const flyCoins = useCallback((from: Anchor, to: Anchor, count = 5) => {
    const flight: CoinFlight = { id: nextId.current++, from, to, count };
    patch(previous => ({ coins: [...previous.coins, flight] }));
  }, [patch]);

  const showScene = useCallback((kind: SceneKind, player: number, amount: number | undefined, blocking: boolean, locked?: number): Promise<void> => {
    const variant: SceneVariant = locked !== undefined ? "locked" : firstSceneRef.current(kind) ? "full" : "brief";
    const scene: SceneShow = { id: nextId.current++, kind, player, blocking, variant, ...(amount === undefined ? {} : { amount }), ...(locked === undefined ? {} : { chapter: locked }) };
    const duration = variant === "full" ? timing.current.scene : variant === "brief" ? timing.current.brief : timing.current.locked;
    audio.play(`scene.${kind}`);
    return new Promise<void>(resolve => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (sceneResolver.current === finish) sceneResolver.current = null;
        patch(previous => (previous.scene?.id === scene.id ? { scene: null } : {}));
        resolve();
      };
      sceneResolver.current?.();
      sceneResolver.current = finish;
      patch({ scene });
      window.setTimeout(finish, duration);
    });
  }, [patch]);

  const record = useCallback((events: LogEvent[]) => {
    const entries = events.map(event => ({ id: nextId.current++, event }));
    setLog(previous => [...previous, ...entries].slice(-logLimit));
  }, []);

  const recordMoney = useCallback((explained: Pick<Explanation, "moves" | "statement">): number | null => {
    const moves = explained.moves.map(move => ({ ...move, id: nextId.current++ }));
    if (moves.length > 0) setLedger(previous => [...previous, ...moves].slice(-ledgerLimit));
    if (!explained.statement) return null;
    const statement: StatementRecord = { ...explained.statement, id: nextId.current++ };
    setStatements(previous => [...previous, statement].slice(-statementLimit));
    return statement.id;
  }, []);

  const present = useCallback(async (before: GameState, action: Action, after: GameState, events: GameEvent[], explained: Explanation, token: number) => {
    const alive = () => generation.current === token;
    const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));
    const t = timing.current;
    const mover = before.currentPlayerIndex;
    const reveal = (): number | null => {
      setView(after);
      record(explained.logEvents);
      return recordMoney(explained);
    };
    const ownerOf = (assetId?: string) => {
      const owned = after.ownedAssets.find(asset => asset.assetId === assetId);
      return owned ? after.players.findIndex(player => player.id === owned.ownerId) : -1;
    };
    const indexOf = (playerId?: string) => after.players.findIndex(player => player.id === playerId);
    const followUps = async (skip: Set<string>) => {
      for (const event of explained.logEvents) {
        if (skip.has(event.type) || !noticeTypes.has(event.type)) continue;
        if (event.type === "player.restarted") {
          setMood("worried", 3200);
          notify(event);
          await showScene("restart", indexOf(event.playerId), event.amount, true);
          if (!alive()) return;
          continue;
        }
        if (event.type === "loan.defaulted" || event.type === "circle.default" || event.type === "asset.forced_sale") {
          audio.play("loan");
          setMood("worried");
        } else if (event.type === "circle.payout") {
          audio.play("circle");
          const receiver = indexOf(event.playerId);
          if (receiver >= 0) flyCoins({ space: 19 }, { player: receiver }, 6);
          setMood("happy");
        } else if (event.type === "audit.released") {
          notify(event);
          setMood("happy");
          await showScene("auditExit", indexOf(event.playerId), undefined, true);
          if (!alive()) return;
          continue;
        }
        notify(event);
      }
    };

    if (action.type === "roll") {
      const rolled = events.find(event => event.type === "dice.rolled");
      const total = rolled?.amount ?? 0;
      const values = rolled?.dice ?? splitDice(total);
      patch({ dice: { values, rolling: true }, banner: null, pulse: null });
      setMood("thinking", 0);
      audio.play("dice");
      if (!before.players[mover]?.isBot) haptic("dice");
      await wait(t.dice);
      if (!alive()) return;
      patch({ dice: { values, rolling: false }, shake: nextId.current++ });
      audio.play("diceStop");
      await wait(t.settle);
      if (!alive()) return;
      const from = before.players[mover]?.position ?? 0;
      const salary = events.find(event => event.type === "start.salary");
      const step = pawnDef(pawnsRef.current[mover], mover).step;
      let position = from;
      for (let hop = 1; hop <= total; hop += 1) {
        position = (from + hop) % before.spaces.length;
        patch({ hop: { player: mover, position } });
        audio.step(step, hop);
        if (position === 0 && salary) {
          notify(salary);
          void showScene("salary", mover, salary.amount, false);
        }
        await wait(t.hop);
        if (!alive()) return;
      }
      patch({ pulse: { space: position, key: nextId.current++ }, focus: position });
      audio.play("land");
      setMood("idle");
      await wait(t.land);
      if (!alive()) return;

      const landed = before.spaces[position];
      const sent = events.find(event => event.type === "audit.sent");
      if (sent) {
        setMood("worried", 0);
        if (!before.players[mover]?.isBot) haptic("loss");
        notify(sent);
        await showScene("audit", mover, undefined, true);
        if (!alive()) return;
        const office = sent.amount ?? auditOffice(after.spaces);
        patch({ hop: { player: mover, position: office, jump: true }, focus: office });
        audio.play("auditSlam");
        await wait(t.jump);
        if (!alive()) return;
        patch({ pulse: { space: office, key: nextId.current++ } });
      } else if (landed?.type === "bank" || landed?.type === "circle" || landed?.type === "rest") {
        const human = !before.players[mover]?.isBot;
        const lockedAt = !human ? undefined : landed.type === "bank" && !featuresRef.current.loans ? chapterOf.loans : landed.type === "circle" && !featuresRef.current.circle ? chapterOf.circle : undefined;
        await showScene(landed.type, mover, undefined, true, lockedAt);
        if (!alive()) return;
      }

      const card = events.find(event => event.type === "card.resolved");
      if (card?.cardKey) {
        const deck = landed?.type === "opportunity" ? "opportunity" : "event";
        const amount = findCard(card.cardKey)?.card.effect.type === "cash" ? card.amount ?? 0 : 0;
        setMood(deck === "opportunity" || amount > 0 ? "happy" : amount < 0 ? "worried" : "surprised", 0);
        if (amount < 0 && !before.players[mover]?.isBot) haptic("loss");
        const show: CardShow = { id: nextId.current++, cardId: card.cardKey, deck, amount, player: mover, auto: Boolean(before.players[mover]?.isBot) };
        await new Promise<void>(resolve => {
          cardResolver.current = resolve;
          patch({ card: show });
          if (show.auto) window.setTimeout(resolve, t.card);
        });
        cardResolver.current = null;
        if (!alive()) return;
        patch({ card: null });
        setMood("idle");
      }

      const rent = events.find(event => event.type === "rent.paid");
      const tax = events.find(event => event.type === "tax.paid");
      if (tax) {
        setMood("worried");
        if (!before.players[mover]?.isBot) haptic("loss");
        await showScene("tax", mover, tax.amount, true);
        if (!alive()) return;
      }
      if (rent) {
        const owner = ownerOf(rent.assetId);
        audio.play("rentPaid");
        if (!before.players[mover]?.isBot) haptic("loss");
        if (owner >= 0) flyCoins({ player: mover }, { player: owner }, 6);
        setMood("surprised");
        await wait(t.coin);
        if (!alive()) return;
        reveal();
        patch({ hop: null });
        audio.play("rentReceived");
        notify(rent, owner >= 0 ? owner : undefined);
      } else {
        reveal();
        patch({ hop: null });
      }
      if (tax) {
        flyCoins({ player: mover }, { space: position }, 4);
        notify(tax);
      }
      await followUps(new Set(["rent.paid", "tax.paid", "start.salary", "audit.sent"]));
      await wait(t.after);
      return;
    }

    if (action.type === "endTurn") {
      patch({ statement: null });
      const statementId = reveal();
      await followUps(new Set());
      if (!alive()) return;
      if (after.phase === "finished") {
        setMood("celebrate", 0);
        return;
      }
      const next = after.currentPlayerIndex;
      const nextIsBot = Boolean(after.players[next]?.isBot);
      const summary = explained.logEvents.find(event => event.type === "turn.statement");
      if (summary && nextIsBot) notify(summary);
      setMood("idle");
      patch({ banner: { player: next, key: nextId.current++, human: !nextIsBot }, dice: null, focus: after.players[next]?.position ?? null, pulse: null });
      audio.play(nextIsBot ? "turn" : "yourTurn");
      await wait(t.banner);
      if (!alive()) return;
      patch({ banner: null, ...(statementId !== null && !nextIsBot ? { statement: statementId } : {}) });
      return;
    }

    reveal();
    const main = events[0];
    if (action.type === "buyAsset") {
      audio.play("buy");
      if (!before.players[mover]?.isBot) haptic("buy");
      const position = before.players[mover]?.position ?? 0;
      flyCoins({ player: mover }, { space: position }, 5);
      setMood("happy");
    } else if (action.type === "upgradeAsset") {
      audio.play("upgrade");
      setMood("happy");
    } else if (action.type === "sellAsset") {
      audio.play("rentReceived");
    } else if (action.type === "takeLoan") {
      audio.play("loan");
      setMood("surprised");
    } else if (action.type === "repayLoan") {
      audio.play("rentPaid");
      setMood("happy");
    } else if (action.type === "buyInsurance") {
      audio.play("upgrade");
      setMood("happy");
    } else if (action.type === "joinCircle") {
      audio.play("circle");
      setMood("happy");
    } else if (action.type === "payAudit") {
      if (main) notify(main);
      setMood("happy");
      await showScene("auditExit", mover, main?.amount, true);
      if (!alive()) return;
      await followUps(new Set(main ? [main.type] : []));
      await wait(t.after);
      return;
    } else if (action.type === "waitAudit") {
      audio.play("auditWait");
      setMood("worried");
    }
    if (main && noticeTypes.has(main.type) && !(action.type === "waitAudit" && events.some(event => event.type === "audit.released"))) notify(main);
    await followUps(new Set(main ? [main.type] : []));
    await wait(t.after);
  }, [flyCoins, notify, patch, record, recordMoney, setMood, showScene]);

  const act = useCallback(async (action: Action) => {
    const current = truthRef.current;
    if (!current || busyRef.current) return;
    let result: { state: GameState; events: GameEvent[] };
    try {
      result = applyAction(current, action);
    } catch {
      return;
    }
    const explained = explainAction(current, action, result.state, result.events);
    truthRef.current = result.state;
    busyRef.current = true;
    setThinking(false);
    setBusy(true);
    setTruth(result.state);
    if (action.type === "roll") patch({ statement: null });
    const token = generation.current;
    try {
      await present(current, action, result.state, result.events, explained, token);
    } finally {
      if (generation.current === token) {
        setView(result.state);
        busyRef.current = false;
        setBusy(false);
      }
    }
  }, [patch, present]);

  const reset = useCallback(() => {
    generation.current += 1;
    cardResolver.current?.();
    cardResolver.current = null;
    sceneResolver.current?.();
    sceneResolver.current = null;
    busyRef.current = false;
    setBusy(false);
    setThinking(false);
    window.clearTimeout(moodTimer.current);
  }, []);

  const open = useCallback((game: GameState, gameNames: string[], gamePawns: string[], saved: { log: LogEntry[]; ledger: MoveRecord[]; statements: StatementRecord[] }, opening: StatementRecord | null, id: number) => {
    reset();
    audio.unlock();
    setGameId(id);
    setNames(gameNames);
    pawnsRef.current = gamePawns;
    setPawns(gamePawns);
    setLog(saved.log);
    setLedger(saved.ledger);
    setStatements(opening ? [...saved.statements, opening] : saved.statements);
    truthRef.current = game;
    setTruth(game);
    setView(game);
    const current = game.currentPlayerIndex;
    const human = !game.players[current]?.isBot;
    const showOpening = opening !== null && human;
    setStage({ ...emptyStage, banner: { player: current, key: nextId.current++, human }, focus: game.players[current]?.position ?? 0 });
    audio.play(human ? "yourTurn" : "turn");
    const token = generation.current;
    busyRef.current = true;
    setBusy(true);
    window.setTimeout(() => {
      if (generation.current !== token) return;
      setStage(previous => ({ ...previous, banner: null, statement: showOpening ? opening.id : null }));
      busyRef.current = false;
      setBusy(false);
    }, timing.current.banner);
  }, [reset]);

  const start = useCallback((config: GameConfig, seats: Seat[]) => {
    const seed = Math.floor(Math.random() * 2_000_000_000);
    const game = createGame({
      ...config,
      playerCount: seats.length as 2 | 3 | 4,
      playerTypes: seats.map(seat => (seat.isBot ? "bot" : "human")),
      botLevels: seats.map(seat => seat.botLevel)
    }, seed);
    nextId.current = 1;
    const first = openingStatement(game);
    const moves = first.moves.map(move => ({ ...move, id: nextId.current++ }));
    const opening: StatementRecord = { ...first.statement, id: nextId.current++ };
    open(game, seats.map(seat => seat.name), seats.map(seat => seat.pawn), { log: [], ledger: moves, statements: [] }, opening, seed);
  }, [open]);

  const resume = useCallback(() => {
    const saved = readSave();
    if (!saved) return;
    nextId.current = saved.nextId;
    const savedPawns = saved.state.players.map((_, index) => saved.pawns?.[index] ?? pawnDef(undefined, index).id);
    open(saved.state, saved.names, savedPawns, { log: saved.log, ledger: saved.ledger ?? [], statements: saved.statements ?? [] }, null, saved.gameId ?? saved.state.randomState);
  }, [open]);

  const clear = useCallback(() => {
    truthRef.current = null;
    setTruth(null);
    setView(null);
    setStage(emptyStage);
  }, []);

  const leave = useCallback(() => {
    reset();
    clear();
    setHasSave(readSave() !== null);
  }, [reset, clear]);

  const discard = useCallback(() => {
    reset();
    writeSave(null);
    setHasSave(false);
    clear();
  }, [reset, clear]);

  const dismissCard = useCallback(() => cardResolver.current?.(), []);
  const dismissScene = useCallback(() => sceneResolver.current?.(), []);
  const dismissStatement = useCallback(() => patch({ statement: null }), [patch]);
  const dismissNotice = useCallback((id: number) => patch(previous => ({ notices: previous.notices.filter(notice => notice.id !== id) })), [patch]);
  const removeCoins = useCallback((id: number) => patch(previous => ({ coins: previous.coins.filter(flight => flight.id !== id) })), [patch]);

  useEffect(() => {
    if (!truth) return;
    if (truth.phase === "finished") {
      writeSave(null);
      return;
    }
    writeSave({ state: truth, names, pawns, log, nextId: nextId.current, ledger, statements, gameId });
  }, [truth, names, pawns, log, ledger, statements, gameId]);

  useEffect(() => {
    if (!truth || busy || truth.phase === "finished") return;
    const current = truth.players[truth.currentPlayerIndex];
    if (!current?.isBot) return;
    setThinking(true);
    setMood("thinking", 0);
    const timer = window.setTimeout(() => {
      const latest = truthRef.current;
      const player = latest?.players[latest.currentPlayerIndex];
      if (!latest || !player?.isBot) return;
      void act(chooseBotAction(latest, player.botLevel));
    }, timing.current.bot + (reduced ? 0 : Math.random() * 600));
    return () => window.clearTimeout(timer);
  }, [truth, busy, act, reduced, setMood]);

  return { truth, view, stage, busy, thinking, names, pawns, log, ledger, statements, hasSave, gameId, start, resume, act, leave, discard, dismissCard, dismissScene, dismissStatement, dismissNotice, removeCoins };
}
