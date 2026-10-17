import { describe, expect, it } from "vitest";
import { applyAction, type GameState } from "../src/engine";
import { addOwnedAsset, stateAt } from "./helpers";

describe("bankruptcy", () => {
  it("sells assets and restarts without eliminating a player", () => {
    let state: GameState = addOwnedAsset(stateAt(1), 0, 1);
    state = { ...state, players: state.players.map((player, index) => index === 0 ? { ...player, cash: -1000, loans: [{ principal: 500, interestRate: 0.08 }] } : player) };
    const result = applyAction(state, { type: "endTurn" });
    expect(result.state.players[0]?.cash).toBe(state.config.restartCash);
    expect(result.state.players[0]?.assets).toHaveLength(0);
    expect(result.state.players[0]?.loans[0]?.principal).toBe(state.config.restartCash);
    expect(result.state.players[0]?.restartExpenseTurns).toBe(state.config.restartExpenseTurns);
    expect(result.state.players).toHaveLength(2);
  });

  it("uses forced asset sale proceeds before restart", () => {
    const state = addOwnedAsset(stateAt(1), 0, 1);
    const insolvent = { ...state, players: state.players.map((player, index) => index === 0 ? { ...player, cash: -50, loans: [{ principal: 1, interestRate: 0.08 }] } : player) };
    const result = applyAction(insolvent, { type: "endTurn" });
    expect(result.events.some(event => event.type === "asset.forced_sale")).toBe(true);
    expect(result.state.players[0]?.assets).toHaveLength(0);
  });
});
