import { describe, expect, it } from "vitest";
import { applyAction, legalActions } from "../src/engine";
import { stateAt } from "./helpers";

describe("insurance", () => {
  it("buys a policy and charges its recurring premium", () => {
    const state = stateAt(1);
    const bought = applyAction(state, { type: "buyInsurance", insuranceType: "property" }).state;
    expect(bought.players[0]?.insurance).toContain("property");
    expect(bought.players[0]?.cash).toBe((state.players[0]?.cash ?? 0) - state.config.insurancePremium);
  });

  it("does not offer duplicate coverage", () => {
    const state = stateAt(1);
    const covered = { ...state, players: state.players.map((player, index) => index === 0 ? { ...player, insurance: ["health" as const] } : player) };
    expect(legalActions(covered).some(action => action.type === "buyInsurance" && action.insuranceType === "health")).toBe(false);
  });

  it("reduces losses from events covered by the policy", () => {
    const base = stateAt(0);
    const protectedState = {
      ...base,
      phase: "roll" as const,
      players: base.players.map((player, index) => index === 0 ? { ...player, insurance: ["health" as const] } : player)
    };
    let matched = false;
    for (let seed = 0; seed < 10000 && !matched; seed += 1) {
      const insured = applyAction({ ...protectedState, randomState: seed }, { type: "roll" });
      const card = insured.events.find(event => event.type === "card.resolved")?.cardKey;
      if (card !== "medical_bill" && card !== "health_check" && card !== "family_care") continue;
      const uninsured = applyAction({ ...base, phase: "roll", randomState: seed }, { type: "roll" });
      const insuredLoss = insured.events.find(event => event.type === "card.resolved")?.amount ?? 0;
      const uninsuredLoss = uninsured.events.find(event => event.type === "card.resolved")?.amount ?? 0;
      expect(insuredLoss).toBeGreaterThan(uninsuredLoss);
      matched = true;
    }
    expect(matched).toBe(true);
  });
});
