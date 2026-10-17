"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyAction, chooseBotAction, createGame } from "../engine";
import type { Action, GameConfig, GameEvent, GameState } from "../engine";

export interface LogEntry {
  id: number;
  event: GameEvent;
}

export interface Seat {
  name: string;
  isBot: boolean;
  botLevel: 1 | 2 | 3;
}

interface Saved {
  state: GameState;
  names: string[];
  log: LogEntry[];
  nextId: number;
}

const saveKey = "fine.save.v1";
const botDelay = 650;
const logLimit = 60;

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

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [hasSave, setHasSave] = useState(false);
  const nextId = useRef(1);
  const stateRef = useRef<GameState | null>(null);

  useEffect(() => {
    setHasSave(readSave() !== null);
  }, []);

  const record = useCallback((events: GameEvent[]) => {
    const entries = events.map(event => ({ id: nextId.current++, event }));
    setLog(previous => [...previous, ...entries].slice(-logLimit));
  }, []);

  const start = useCallback((config: GameConfig, seats: Seat[]) => {
    const seed = Math.floor(Math.random() * 2_000_000_000);
    const game = createGame({
      ...config,
      playerCount: seats.length as 2 | 3 | 4,
      playerTypes: seats.map(seat => (seat.isBot ? "bot" : "human")),
      botLevels: seats.map(seat => seat.botLevel)
    }, seed);
    nextId.current = 1;
    setNames(seats.map(seat => seat.name));
    setLog([]);
    stateRef.current = game;
    setState(game);
  }, []);

  const resume = useCallback(() => {
    const saved = readSave();
    if (!saved) return;
    nextId.current = saved.nextId;
    setNames(saved.names);
    setLog(saved.log);
    stateRef.current = saved.state;
    setState(saved.state);
  }, []);

  const act = useCallback((action: Action) => {
    const current = stateRef.current;
    if (!current) return;
    try {
      const result = applyAction(current, action);
      stateRef.current = result.state;
      setState(result.state);
      record(result.events);
    } catch {
      return;
    }
  }, [record]);

  const leave = useCallback(() => {
    stateRef.current = null;
    setState(null);
    setHasSave(readSave() !== null);
  }, []);

  const discard = useCallback(() => {
    writeSave(null);
    setHasSave(false);
    stateRef.current = null;
    setState(null);
  }, []);

  useEffect(() => {
    if (!state) return;
    if (state.phase === "finished") {
      writeSave(null);
      return;
    }
    writeSave({ state, names, log, nextId: nextId.current });
  }, [state, names, log]);

  const current = state?.players[state.currentPlayerIndex];
  const botTurn = Boolean(state && state.phase !== "finished" && current?.isBot);

  useEffect(() => {
    if (!state || !botTurn || !current) return;
    const timer = window.setTimeout(() => {
      act(chooseBotAction(state, current.botLevel));
    }, botDelay);
    return () => window.clearTimeout(timer);
  }, [state, botTurn, current, act]);

  return { state, names, log, hasSave, botTurn, start, resume, act, leave, discard };
}
