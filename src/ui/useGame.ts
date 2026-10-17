"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { applyAction, chooseBotAction, createGame } from "../engine";
import type { Action, GameConfig, GameEvent, GameState } from "../engine";
import { audio } from "./audio/engine";
import { findCard } from "./text";
import type { FinoMood } from "./components/Fino";

export interface LogEntry {
  id: number;
  event: GameEvent;
}

export interface Seat {
  name: string;
  isBot: boolean;
  botLevel: 1 | 2 | 3;
}

export interface Notice {
  id: number;
  event: GameEvent;
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

export type Anchor = { player: number } | { space: number };

export interface CoinFlight {
  id: number;
  from: Anchor;
  to: Anchor;
  count: number;
}

export interface Stage {
  dice: { values: [number, number]; rolling: boolean } | null;
  hop: { player: number; position: number } | null;
  pulse: { space: number; key: number } | null;
  banner: { player: number; key: number } | null;
  card: CardShow | null;
  notices: Notice[];
  coins: CoinFlight[];
  mood: FinoMood;
  focus: number | null;
}

interface Saved {
  state: GameState;
  names: string[];
  log: LogEntry[];
  nextId: number;
}

const saveKey = "fine.save.v1";
const logLimit = 80;
const emptyStage: Stage = { dice: null, hop: null, pulse: null, banner: null, card: null, notices: [], coins: [], mood: "idle", focus: null };
const normalTiming = { dice: 1150, settle: 320, hop: 235, land: 380, banner: 1350, after: 420, coin: 700, card: 4400, bot: 1200 };
const reducedTiming = { dice: 450, settle: 120, hop: 110, land: 200, banner: 900, after: 250, coin: 300, card: 2600, bot: 600 };

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
  "player.restarted",
  "trade.completed"
]);

function readSave(): Saved | null {
  try {
    const raw = window.localStorage.getItem(saveKey);
    return raw ? (JSON.parse(raw) as Saved) : null;
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
  const [log, setLog] = useState<LogEntry[]>([]);
  const [hasSave, setHasSave] = useState(false);
  const nextId = useRef(1);
  const truthRef = useRef<GameState | null>(null);
  const busyRef = useRef(false);
  const generation = useRef(0);
  const cardResolver = useRef<(() => void) | null>(null);
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

  const setMood = useCallback((mood: FinoMood, hold = 2600) => {
    window.clearTimeout(moodTimer.current);
    patch({ mood });
    if (mood !== "idle" && hold > 0) moodTimer.current = window.setTimeout(() => patch({ mood: "idle" }), hold);
  }, [patch]);

  const notify = useCallback((event: GameEvent, owner?: number) => {
    const notice: Notice = { id: nextId.current++, event, ...(owner === undefined ? {} : { owner }) };
    patch(previous => ({ notices: [...previous.notices, notice].slice(-3) }));
  }, [patch]);

  const flyCoins = useCallback((from: Anchor, to: Anchor, count = 5) => {
    const flight: CoinFlight = { id: nextId.current++, from, to, count };
    patch(previous => ({ coins: [...previous.coins, flight] }));
  }, [patch]);

  const record = useCallback((events: GameEvent[]) => {
    const entries = events.map(event => ({ id: nextId.current++, event }));
    setLog(previous => [...previous, ...entries].slice(-logLimit));
  }, []);

  const present = useCallback(async (before: GameState, action: Action, after: GameState, events: GameEvent[], token: number) => {
    const alive = () => generation.current === token;
    const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));
    const t = timing.current;
    const mover = before.currentPlayerIndex;
    const reveal = () => {
      setView(after);
      record(events);
    };
    const ownerOf = (assetId?: string) => {
      const owned = after.ownedAssets.find(asset => asset.assetId === assetId);
      return owned ? after.players.findIndex(player => player.id === owned.ownerId) : -1;
    };
    const indexOf = (playerId?: string) => after.players.findIndex(player => player.id === playerId);
    const followUps = (skip: Set<string>) => {
      for (const event of events) {
        if (skip.has(event.type) || !noticeTypes.has(event.type)) continue;
        if (event.type === "player.restarted") {
          audio.play("restart");
          setMood("worried", 3200);
        } else if (event.type === "loan.defaulted" || event.type === "circle.default" || event.type === "asset.forced_sale") {
          audio.play("loan");
          setMood("worried");
        } else if (event.type === "circle.payout") {
          audio.play("circle");
          const receiver = indexOf(event.playerId);
          if (receiver >= 0) flyCoins({ space: 19 }, { player: receiver }, 6);
          setMood("happy");
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
      await wait(t.dice);
      if (!alive()) return;
      patch({ dice: { values, rolling: false } });
      await wait(t.settle);
      if (!alive()) return;
      const from = before.players[mover]?.position ?? 0;
      const salary = events.find(event => event.type === "start.salary");
      let position = from;
      for (let step = 1; step <= total; step += 1) {
        position = (from + step) % before.spaces.length;
        patch({ hop: { player: mover, position } });
        audio.play("step");
        if (position === 0 && salary) {
          audio.play("salary");
          notify(salary);
        }
        await wait(t.hop);
        if (!alive()) return;
      }
      patch({ pulse: { space: position, key: nextId.current++ }, focus: position });
      audio.play("land");
      setMood("idle");
      await wait(t.land);
      if (!alive()) return;

      const card = events.find(event => event.type === "card.resolved");
      if (card?.cardKey) {
        const deck = before.spaces[position]?.type === "opportunity" ? "opportunity" : "event";
        const amount = findCard(card.cardKey)?.card.effect.type === "cash" ? card.amount ?? 0 : 0;
        setMood(deck === "opportunity" || amount > 0 ? "happy" : amount < 0 ? "worried" : "surprised", 0);
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
      if (rent) {
        const owner = ownerOf(rent.assetId);
        audio.play("rentPaid");
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
        audio.play("tax");
        flyCoins({ player: mover }, { space: position }, 4);
        setMood("worried");
        notify(tax);
      }
      followUps(new Set(["rent.paid", "tax.paid", "start.salary"]));
      await wait(t.after);
      return;
    }

    if (action.type === "endTurn") {
      reveal();
      followUps(new Set(["turn.income", "turn.expenses"]));
      if (after.phase === "finished") {
        setMood("celebrate", 0);
        return;
      }
      const next = after.currentPlayerIndex;
      setMood("idle");
      patch({ banner: { player: next, key: nextId.current++ }, dice: null, focus: after.players[next]?.position ?? null, pulse: null });
      audio.play("turn");
      await wait(t.banner);
      if (!alive()) return;
      patch({ banner: null });
      return;
    }

    reveal();
    const main = events[0];
    if (action.type === "buyAsset") {
      audio.play("buy");
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
    }
    if (main && noticeTypes.has(main.type)) notify(main);
    followUps(new Set(main ? [main.type] : []));
    await wait(t.after);
  }, [flyCoins, notify, patch, record, setMood]);

  const act = useCallback(async (action: Action) => {
    const current = truthRef.current;
    if (!current || busyRef.current) return;
    let result: { state: GameState; events: GameEvent[] };
    try {
      result = applyAction(current, action);
    } catch {
      return;
    }
    truthRef.current = result.state;
    busyRef.current = true;
    setThinking(false);
    setBusy(true);
    setTruth(result.state);
    const token = generation.current;
    try {
      await present(current, action, result.state, result.events, token);
    } finally {
      if (generation.current === token) {
        setView(result.state);
        busyRef.current = false;
        setBusy(false);
      }
    }
  }, [present]);

  const reset = useCallback(() => {
    generation.current += 1;
    cardResolver.current?.();
    cardResolver.current = null;
    busyRef.current = false;
    setBusy(false);
    setThinking(false);
    window.clearTimeout(moodTimer.current);
  }, []);

  const open = useCallback((game: GameState, gameNames: string[], gameLog: LogEntry[]) => {
    reset();
    audio.unlock();
    setNames(gameNames);
    setLog(gameLog);
    truthRef.current = game;
    setTruth(game);
    setView(game);
    const current = game.currentPlayerIndex;
    setStage({ ...emptyStage, banner: { player: current, key: nextId.current++ }, focus: game.players[current]?.position ?? 0 });
    audio.play("turn");
    const token = generation.current;
    busyRef.current = true;
    setBusy(true);
    window.setTimeout(() => {
      if (generation.current !== token) return;
      setStage(previous => ({ ...previous, banner: null }));
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
    open(game, seats.map(seat => seat.name), []);
  }, [open]);

  const resume = useCallback(() => {
    const saved = readSave();
    if (!saved) return;
    nextId.current = saved.nextId;
    open(saved.state, saved.names, saved.log);
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
  const dismissNotice = useCallback((id: number) => patch(previous => ({ notices: previous.notices.filter(notice => notice.id !== id) })), [patch]);
  const removeCoins = useCallback((id: number) => patch(previous => ({ coins: previous.coins.filter(flight => flight.id !== id) })), [patch]);

  useEffect(() => {
    if (!truth) return;
    if (truth.phase === "finished") {
      writeSave(null);
      return;
    }
    writeSave({ state: truth, names, log, nextId: nextId.current });
  }, [truth, names, log]);

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

  return { truth, view, stage, busy, thinking, names, log, hasSave, start, resume, act, leave, discard, dismissCard, dismissNotice, removeCoins };
}
