import { describe, expect, it } from "vitest";
import { applyAction, legalActions } from "../src/engine";
import { addOwnedAsset, completeTurn, stateAt } from "./helpers";

describe("loans", () => {
  it("limits borrowing to collateral and charges interest", () => {
    let state = addOwnedAsset(stateAt(1), 0, 10);
    const borrow = legalActions(state).find(action => action.type === "takeLoan");
    expect(borrow?.type).toBe("takeLoan");
    if (!borrow || borrow.type !== "takeLoan") return;
    state = applyAction(state, borrow).state;
    expect(state.players[0]?.loans[0]?.principal).toBe(borrow.amount);
    const withLoanCash = state.players[0]?.cash ?? 0;
    state = completeTurn(state);
    state = completeTurn(state);
    const withoutLoan = addOwnedAsset(stateAt(1), 0, 1);
    let baseline = completeTurn(withoutLoan);
    baseline = completeTurn(baseline);
    const interest = Math.ceil(borrow.amount * config.loanInterest);
    expect((state.players[0]?.cash ?? 0) - (baseline.players[0]?.cash ?? 0)).toBe(withLoanCash - (withoutLoan.players[0]?.cash ?? 0) - interest);
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
