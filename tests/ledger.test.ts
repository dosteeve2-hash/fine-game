import { describe, expect, it } from "vitest";
import configs from "../src/data/config.json";
import board from "../src/data/board.json";
import { applyAction, chooseBotAction, createGame, expenseBreakdown, incomeBreakdown, salaryPreview } from "../src/engine";
import { explainAction, openingStatement } from "../src/engine/ledger";
import type { Action, GameConfig, GameState } from "../src/engine";
import { addOwnedAsset, stateAt } from "./helpers";

function botGame(mode: "quick" | "standard" | "long", seed: number, count: 2 | 3 | 4): GameState {
  const config = configs[mode] as GameConfig;
  return createGame({ ...config, playerCount: count, playerTypes: Array(count).fill("bot"), botLevels: Array.from({ length: count }, (_, index) => ((index % 3) + 1) as 1 | 2 | 3) }, seed);
}

describe("income, expense and salary breakdowns", () => {
  it("lists every asset, with the family bonus and the market multiplier", () => {
    let state = stateAt(0);
    const trade = board.map((space, index) => ({ space, index })).filter(item => item.space.family === "trade");
    for (const item of trade) state = addOwnedAsset(state, 0, item.index, 2);
    state = { ...state, marketEffects: [{ family: "trade", multiplier: 0.5, turnsRemaining: 2 }] };
    const breakdown = incomeBreakdown(state, "player-1");
    expect(breakdown.lines).toHaveLength(4);
    expect(breakdown.lines.every(line => line.familyBonusApplied && line.marketMultiplier === 0.5 && line.level === 2)).toBe(true);
    expect(breakdown.lines.reduce((sum, line) => sum + line.amount, 0)).toBe(breakdown.total);
    const exact = trade.reduce((sum, item) => sum + (item.space.baseIncome ?? 0) * 2 * 0.5 * 1.25, 0);
    expect(breakdown.total).toBe(Math.floor(exact));
  });

  it("splits expenses into living cost, interest per loan, insurance per policy and restart surcharge", () => {
    const base = stateAt(0);
    const state: GameState = {
      ...base,
      players: base.players.map((player, index) => index === 0
        ? { ...player, loans: [{ principal: 250, interestRate: 0.04 }, { principal: 100, interestRate: 0.07 }], insurance: ["health", "harvest"], baseExpenses: Math.ceil(65 * 1.1), restartExpenseTurns: 3 }
        : player)
    };
    const expenses = expenseBreakdown(state, "player-1");
    expect(expenses.interest).toEqual([{ principal: 250, rate: 0.04, amount: 10 }, { principal: 100, rate: 0.07, amount: 8 }]);
    expect(expenses.insurance).toHaveLength(2);
    expect(expenses.restartSurcharge).toBe(7);
    expect(expenses.living).toBe(65);
    expect(expenses.total).toBe(72 + 18 + 30);
  });

  it("announces the salary reduction and the turn it starts", () => {
    const state = stateAt(0);
    const fresh = salaryPreview({ ...state, phase: "roll" }, "player-1");
    expect(fresh.reduced).toBe(false);
    expect(fresh.amount).toBe(state.config.salary);
    expect(fresh.turnsBeforeReduction).toBe(state.config.salaryReductionAfterTurns - state.players[0]!.turnsPlayed);
    const late: GameState = { ...state, phase: "roll", players: state.players.map((player, index) => index === 0 ? { ...player, turnsPlayed: state.config.salaryReductionAfterTurns } : player) };
    const reduced = salaryPreview(late, "player-1");
    expect(reduced.reduced).toBe(true);
    expect(reduced.amount).toBe(state.config.salary - state.config.salaryReduction);
    expect(reduced.reducedAfterTurns).toBe(state.config.salaryReductionAfterTurns);
  });
});

describe("the ledger explains every cash movement", () => {
  it("matches the real cash changes, with a reason for each, over full bot games", () => {
    let salaries = 0;
    let statements = 0;
    for (const mode of ["quick", "standard", "long"] as const) {
      for (const seed of [3, 29]) {
        for (const count of [2, 3, 4] as const) {
          let state = botGame(mode, seed * 7 + count, count);
          const opening = openingStatement(state);
          expect(opening.statement.cashAfter).toBe(state.players[0]?.cash);
          for (let step = 0; step < 900 && state.phase !== "finished"; step += 1) {
            const player = state.players[state.currentPlayerIndex]!;
            const action: Action = chooseBotAction(state, player.botLevel);
            const before = state;
            if (action.type === "roll") {
              const predicted = salaryPreview(before, player.id).amount;
              const result = applyAction(before, action);
              const salary = result.events.find(event => event.type === "start.salary");
              if (salary) {
                salaries += 1;
                expect(salary.amount).toBe(predicted);
              }
            }
            const { state: after, events } = applyAction(before, action);
            const explained = explainAction(before, action, after, events);
            for (const participant of after.players) {
              const mine = explained.moves.filter(move => move.playerId === participant.id);
              const delta = participant.cash - (before.players.find(item => item.id === participant.id)?.cash ?? 0);
              expect(mine.reduce((sum, move) => sum + move.amount, 0)).toBe(delta);
              if (mine.length > 0) expect(mine[mine.length - 1]?.cashAfter).toBe(participant.cash);
            }
            expect(explained.moves.filter(move => move.reason === "other")).toEqual([]);
            expect(explained.moves.every(move => move.amount !== 0)).toBe(true);
            const start = events.find(event => event.type === "turn.income");
            if (start?.playerId) {
              const expenseEvent = events.find(event => event.type === "turn.expenses");
              expect(incomeBreakdown(before, start.playerId).total).toBe(start.amount);
              expect(expenseBreakdown(before, start.playerId).total).toBe(expenseEvent?.amount);
              const statement = explained.statement;
              expect(statement).not.toBeNull();
              if (statement) {
                statements += 1;
                const nextPlayer = after.players.find(item => item.id === start.playerId);
                const restarted = events.some(event => event.type === "player.restarted" && event.playerId === start.playerId);
                const defaulted = events.some(event => (event.type === "loan.defaulted" || event.type === "asset.forced_sale") && event.playerId === start.playerId);
                if (!restarted && !defaulted) expect(statement.cashAfter).toBe(nextPlayer?.cash);
                expect(statement.net).toBe((start.amount ?? 0) - (expenseEvent?.amount ?? 0));
              }
            }
            state = after;
          }
        }
      }
    }
    expect(salaries).toBeGreaterThan(20);
    expect(statements).toBeGreaterThan(60);
  }, 120000);
});

describe("the Circle in the ledger", () => {
  it("shows the contribution, then the payout, and keeps the books balanced", () => {
    let state = stateAt(5);
    const seen = new Set<string>();
    const settle = (action: Action) => {
      const before = state;
      const { state: after, events } = applyAction(before, action);
      const explained = explainAction(before, action, after, events);
      for (const participant of after.players) {
        const mine = explained.moves.filter(move => move.playerId === participant.id).reduce((sum, move) => sum + move.amount, 0);
        expect(mine).toBe(participant.cash - (before.players.find(item => item.id === participant.id)?.cash ?? 0));
      }
      for (const move of explained.moves) seen.add(move.reason);
      expect(explained.moves.some(move => move.reason === "other")).toBe(false);
      state = after;
    };
    settle({ type: "joinCircle" });
    settle({ type: "endTurn" });
    state = { ...state, phase: "actions", players: state.players.map((player, index) => index === 1 ? { ...player, position: 5 } : player) };
    settle({ type: "joinCircle" });
    settle({ type: "endTurn" });
    state = { ...state, phase: "actions" };
    settle({ type: "endTurn" });
    expect(seen.has("circleContribution")).toBe(true);
    expect(seen.has("circlePayout")).toBe(true);
  });
});
