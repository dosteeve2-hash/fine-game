import { describe, expect, it } from "vitest";
import { applyAction, chooseBotAction, createGame } from "../src/engine";
import { config } from "./helpers";

describe("determinism", () => {
  it("replays identical seeds and bot decisions to the same state", () => {
    let first = createGame({ ...config, playerCount: 4, botLevels: [1, 2, 3, 3] }, 9317);
    let second = createGame({ ...config, playerCount: 4, botLevels: [1, 2, 3, 3] }, 9317);
    first = { ...first, players: first.players.map(player => ({ ...player, isBot: true })) };
    second = { ...second, players: second.players.map(player => ({ ...player, isBot: true })) };
    for (let index = 0; index < 50 && first.phase !== "finished"; index += 1) {
      const a = chooseBotAction(first, first.players[first.currentPlayerIndex]?.botLevel ?? 1);
      const b = chooseBotAction(second, second.players[second.currentPlayerIndex]?.botLevel ?? 1);
      expect(a).toEqual(b);
      first = applyAction(first, a).state;
      second = applyAction(second, b).state;
    }
    expect(first).toEqual(second);
  });
});
