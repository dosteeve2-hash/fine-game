import { describe, expect, it } from "vitest";
import { applyAction, auditOffice, chooseBotAction, legalActions, type GameState } from "../src/engine";
import { addOwnedAsset, stateAt } from "./helpers";

const auditSpace = 17;

function rollOnto(target: number): { before: GameState; after: GameState; events: ReturnType<typeof applyAction>["events"] } {
  const base = stateAt(target - 7);
  for (let seed = 0; seed < 2000; seed += 1) {
    const before: GameState = { ...base, phase: "roll", randomState: seed };
    const result = applyAction(before, { type: "roll" });
    if (result.events.some(event => event.type === "space.landed" && event.amount === target)) return { before, after: result.state, events: result.events };
  }
  throw new Error("No seed reaches the target space");
}

function held(state: GameState, turns = 2): GameState {
  const office = auditOffice(state.spaces);
  return { ...state, phase: "roll", players: state.players.map((player, index) => index === 0 ? { ...player, position: office, auditTurns: turns } : player) };
}

describe("audit", () => {
  it("sends a player who lands on the tax audit to the audit office, without salary", () => {
    expect(stateAt(0).spaces[auditSpace]?.type).toBe("audit");
    const { before, after, events } = rollOnto(auditSpace);
    const office = auditOffice(after.spaces);
    expect(after.spaces[office]?.office).toBe(true);
    expect(after.players[0]?.position).toBe(office);
    expect(after.players[0]?.auditTurns).toBe(after.config.auditTurns);
    expect(events.some(event => event.type === "audit.sent" && event.amount === office)).toBe(true);
    expect(events.some(event => event.type === "start.salary")).toBe(false);
    expect(after.players[0]?.cash).toBe(before.players[0]?.cash);
  });

  it("lets a held player pay the settlement and roll at once", () => {
    const state = held(stateAt(0));
    const actions = legalActions(state);
    expect(actions).toContainEqual({ type: "payAudit" });
    expect(actions).toContainEqual({ type: "waitAudit" });
    expect(actions.some(action => action.type === "roll")).toBe(false);
    const paid = applyAction(state, { type: "payAudit" });
    expect(paid.state.players[0]?.cash).toBe((state.players[0]?.cash ?? 0) - state.config.auditFee);
    expect(paid.state.players[0]?.auditTurns).toBe(0);
    expect(paid.state.phase).toBe("roll");
    expect(legalActions(paid.state)).toContainEqual({ type: "roll" });
    expect(paid.events).toContainEqual({ type: "audit.paid", playerId: "player-1", amount: state.config.auditFee });
  });

  it("cannot pay the settlement without enough cash", () => {
    const state = held(stateAt(0));
    const broke = { ...state, players: state.players.map((player, index) => index === 0 ? { ...player, cash: state.config.auditFee - 1 } : player) };
    expect(legalActions(broke).some(action => action.type === "payAudit")).toBe(false);
    expect(legalActions(broke)).toContainEqual({ type: "waitAudit" });
  });

  it("releases a player after waiting the configured number of turns", () => {
    let state = held(stateAt(0));
    const office = auditOffice(state.spaces);
    const first = applyAction(state, { type: "waitAudit" });
    expect(first.state.players[0]?.position).toBe(office);
    expect(first.state.players[0]?.auditTurns).toBe(1);
    expect(first.state.phase).toBe("actions");
    expect(first.events.some(event => event.type === "audit.released")).toBe(false);
    state = { ...first.state, phase: "roll" };
    const second = applyAction(state, { type: "waitAudit" });
    expect(second.state.players[0]?.auditTurns).toBe(0);
    expect(second.events.some(event => event.type === "audit.released")).toBe(true);
    const free = { ...second.state, phase: "roll" as const };
    expect(legalActions(free)).toContainEqual({ type: "roll" });
    expect(legalActions(free).some(action => action.type === "waitAudit")).toBe(false);
  });

  it("keeps collecting income and paying expenses while held", () => {
    let state = addOwnedAsset(stateAt(5), 1, 1, 3);
    const office = auditOffice(state.spaces);
    state = { ...state, players: state.players.map((player, index) => index === 1 ? { ...player, position: office, auditTurns: 2 } : player) };
    const before = state.players[1];
    const result = applyAction(state, { type: "endTurn" });
    const income = result.events.find(event => event.type === "turn.income" && event.playerId === "player-2")?.amount ?? 0;
    const expenses = result.events.find(event => event.type === "turn.expenses" && event.playerId === "player-2")?.amount ?? 0;
    expect(income).toBeGreaterThan(0);
    expect(result.state.players[1]?.cash).toBe((before?.cash ?? 0) + income - expenses);
    expect(result.state.players[1]?.auditTurns).toBe(2);
    expect(result.state.players[1]?.position).toBe(office);
  });

  it("lets held robots choose only legal audit actions", () => {
    const state = held(stateAt(0));
    for (const level of [1, 2, 3] as const) {
      const action = chooseBotAction(state, level);
      expect(["payAudit", "waitAudit"]).toContain(action.type);
      expect(legalActions(state)).toContainEqual(action);
    }
    const broke = { ...state, players: state.players.map((player, index) => index === 0 ? { ...player, cash: 0 } : player) };
    expect(chooseBotAction(broke, 3)).toEqual({ type: "waitAudit" });
  });

  it("lets players manage their assets before rolling", () => {
    const state = { ...addOwnedAsset(stateAt(0), 0, 1), phase: "roll" as const };
    const actions = legalActions(state);
    expect(actions).toContainEqual({ type: "roll" });
    expect(actions).toContainEqual({ type: "sellAsset", assetId: "trade_kampala" });
    expect(actions).toContainEqual({ type: "upgradeAsset", assetId: "trade_kampala" });
    const upgraded = applyAction(state, { type: "upgradeAsset", assetId: "trade_kampala" });
    expect(upgraded.state.phase).toBe("roll");
    expect(upgraded.state.players[0]?.assets[0]?.level).toBe(2);
  });
});
