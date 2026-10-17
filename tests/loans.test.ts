import { describe, expect, it } from "vitest";
import { applyAction, legalActions } from "../src/engine";
import { addOwnedAsset, completeTurn, config, stateAt } from "./helpers";

describe("loans", () => {
  it("limits borrowing to collateral and charges interest", () => {
    const base = addOwnedAsset(stateAt(1), 0, 1, 3);
    const borrow = legalActions(base).find(action => action.type === "takeLoan");
    expect(borrow?.type).toBe("takeLoan");
    if (!borrow || borrow.type !== "takeLoan") return;
    const withLoan = applyAction(base, borrow).state;
    expect(withLoan.players[0]?.loans[0]?.principal).toBe(borrow.amount);
    const borrowed = completeTurn(completeTurn(withLoan));
    const control = completeTurn(completeTurn(base));
    const gain = (borrowed.players[0]?.cash ?? 0) - (control.players[0]?.cash ?? 0);
    const interest = Math.ceil(borrow.amount * config.loanInterest);
    expect(gain).toBeLessThan(borrow.amount);
    expect(gain).toBeGreaterThanOrEqual(borrow.amount - 3 * interest);
  });

  it("repays principal without changing the original state", () => {
    const state = addOwnedAsset(stateAt(1), 0, 10);
    const withLoan = applyAction(state, { type: "takeLoan", amount: 250 }).state;
    const before = withLoan.players[0]?.cash ?? 0;
    const repaid = applyAction(withLoan, { type: "repayLoan", amount: 250 }).state;
    expect(repaid.players[0]?.loans).toHaveLength(0);
    expect(repaid.players[0]?.cash).toBe(before - 250);
    expect(withLoan.players[0]?.loans).toHaveLength(1);
  });
});
