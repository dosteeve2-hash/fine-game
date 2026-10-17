import { describe, expect, it } from "vitest";
import { applyAction, getWinner } from "../src/engine";
import type { GameConfig } from "../src/engine/types";
import { addOwnedAsset, config, stateAt } from "./helpers";

describe("victory", () => {
  it("declares freedom only after the configured consecutive turns", () => {
    const victoryConfig: GameConfig = { ...config, freedomTurns: 1 };
    let state = addOwnedAsset(stateAt(1), 0, 1, 3);
    state = { ...state, config: victoryConfig };
    const result = applyAction(state, { type: "endTurn" }).state;
    expect(getWinner(result)).toBe("player-1");
    expect(result.endReason).toBe("freedom");
  });

  it("uses net worth at the turn limit", () => {
    const limitConfig: GameConfig = { ...config, maxTurns: 1, freedomTurns: 999 };
    let state = stateAt(1);
    state = { ...state, config: limitConfig };
    const result = applyAction(state, { type: "endTurn" }).state;
    expect(result.endReason).toBe("turn_limit");
    expect(getWinner(result)).toBe(result.winner);
  });
});
