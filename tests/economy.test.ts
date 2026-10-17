import { describe, expect, it } from "vitest";
import { applyAction, legalActions } from "../src/engine";
import { addOwnedAsset, stateAt } from "./helpers";

describe("economy", () => {
  it("buys and upgrades an asset without mutating the previous state", () => {
    const original = stateAt(1);
    const bought = applyAction(original, { type: "buyAsset" }).state;
    expect(bought.players[0]?.assets).toHaveLength(1);
    expect(original.players[0]?.assets).toHaveLength(0);
    const upgraded = applyAction(bought, { type: "upgradeAsset", assetId: "trade_kampala" }).state;
    expect(upgraded.players[0]?.assets[0]?.level).toBe(2);
  });

  it("applies a one-time price reduction to the next asset purchase", () => {
    const state = stateAt(1);
    const discounted = {
      ...state,
      players: state.players.map((player, index) => index === 0 ? { ...player, assetDiscount: 0.8 } : player)
    };
    const result = applyAction(discounted, { type: "buyAsset" });
    expect(result.events.find(event => event.type === "asset.bought")?.amount).toBe(192);
    expect(result.state.players[0]?.assetDiscount).toBe(1);
  });

  it("charges rent to a visitor and credits the owner", () => {
    let state = addOwnedAsset(stateAt(0), 1, 3);
    state = { ...state, phase: "roll", players: state.players.map((player, index) => index === 0 ? { ...player, position: 0 } : player) };
    let result = applyAction(state, { type: "roll" });
    for (let seed = 0; seed < 300 && result.state.players[0]?.position !== 3; seed += 1) {
      state = { ...state, randomState: seed };
      result = applyAction(state, { type: "roll" });
    }
    expect(result.events.some(event => event.type === "rent.paid")).toBe(true);
    expect(result.state.players[1]?.cash).toBeGreaterThan(state.players[1]?.cash ?? 0);
  });

  it("offers purchases only on an affordable unowned property", () => {
    expect(legalActions(stateAt(1)).some(action => action.type === "buyAsset")).toBe(true);
    const poor = stateAt(1);
    const broke = { ...poor, players: poor.players.map((player, index) => index === 0 ? { ...player, cash: 0 } : player) };
    expect(legalActions(broke).some(action => action.type === "buyAsset")).toBe(false);
  });

  it("exchanges assets and optional cash only when both players agree", () => {
    let state = addOwnedAsset(stateAt(1), 0, 1);
    state = addOwnedAsset(state, 1, 3);
    const agreement = {
      type: "proposeTrade" as const,
      otherPlayerId: "player-2",
      offeredAssetId: "trade_kampala",
      requestedAssetId: "trade_accra",
      offeredCash: 0,
      requestedCash: 0,
      accepted: true
    };
    expect(legalActions(state)).toContainEqual(agreement);
    const completed = applyAction(state, agreement).state;
    expect(completed.players[0]?.assets.map(asset => asset.assetId)).toContain("trade_accra");
    expect(completed.players[1]?.assets.map(asset => asset.assetId)).toContain("trade_kampala");
    expect(state.players[0]?.assets.map(asset => asset.assetId)).toContain("trade_kampala");
  });
});
