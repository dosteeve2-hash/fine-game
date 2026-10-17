import { describe, expect, it } from "vitest";
import { chooseBotAction, createGame, legalActions } from "../src/engine";
import { config } from "./helpers";

describe("bots", () => {
  it("chooses only legal actions for each difficulty", () => {
    const state = createGame(config, 108);
    for (const level of [1, 2, 3] as const) {
      const action = chooseBotAction(state, level);
      expect(legalActions(state)).toContainEqual(action);
    }
  });
});
