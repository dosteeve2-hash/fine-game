import { describe, expect, it } from "vitest";
import { applyAction, type GameState } from "../src/engine";
import { completeTurn, stateAt } from "./helpers";

describe("circle", () => {
  it("collects contributions and pays the receiver in order", () => {
    let state = stateAt(5);
    const first = state.players[0];
    const second = state.players[1];
    if (!first || !second) throw new Error("Expected two players");
    state = {
      ...state,
      circle: { members: [first.id, second.id], receiverOrder: [second.id, first.id], nextReceiver: 0, contributedThisRound: [], pot: 0, roundsCompleted: 0 }
    };
    state = completeTurn(state);
    state = completeTurn(state);
    expect(state.players[1]?.cash).toBeGreaterThan(state.config.startingCash - state.config.baseExpenses);
    expect(state.circle?.roundsCompleted).toBe(1);
  });

  it("automatically borrows when a member cannot contribute", () => {
    let state: GameState = stateAt(5);
    const first = state.players[0];
    const second = state.players[1];
    if (!first || !second) throw new Error("Expected two players");
    state = {
      ...state,
      circle: { members: [first.id, second.id], receiverOrder: [second.id, first.id], nextReceiver: 0, contributedThisRound: [], pot: 0, roundsCompleted: 0 },
      players: state.players.map((player, index) => index === 0 ? { ...player, cash: 0 } : player)
    };
    const result = applyAction(state, { type: "endTurn" });
    expect(result.events.some(event => event.type === "circle.default")).toBe(true);
    expect(result.state.players[0]?.reputation).toBe(-1);
  });
});
