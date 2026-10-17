import { describe, expect, it } from "vitest";
import { applyAction, createGame } from "../src/engine";
import { config } from "./helpers";

describe("dice", () => {
  it("reports both dice values with the rolled total", () => {
    for (const seed of [1, 7, 42, 9317, 123456]) {
      const state = createGame(config, seed);
      const before = state.players[0]?.position ?? 0;
      const { state: after, events } = applyAction(state, { type: "roll" });
      const rolled = events.find(event => event.type === "dice.rolled");
      expect(rolled?.dice).toHaveLength(2);
      const [a, b] = rolled?.dice ?? [0, 0];
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(6);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(6);
      expect(a + b).toBe(rolled?.amount);
      expect(after.players[0]?.position).toBe((before + a + b) % state.spaces.length);
    }
  });
});
