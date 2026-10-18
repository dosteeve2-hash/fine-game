import eventData from "../data/events.json";
import opportunityData from "../data/opportunities.json";
import { expenseBreakdown, incomeBreakdown } from "./index";
import type { ExpenseBreakdown, IncomeBreakdown } from "./index";
import type { Action, GameCard, GameEvent, GameState, PlayerId } from "./types";

const cashCards = new Set([...(eventData as GameCard[]), ...(opportunityData as GameCard[])].filter(card => card.effect.type === "cash").map(card => card.id));

export type MoveReason =
  | "income"
  | "living"
  | "restartSurcharge"
  | "interest"
  | "insurance"
  | "salary"
  | "rentReceived"
  | "rentPaid"
  | "tax"
  | "auditFee"
  | "card"
  | "assetBought"
  | "assetUpgraded"
  | "assetSold"
  | "forcedSale"
  | "loanTaken"
  | "loanRepaid"
  | "loanDefaulted"
  | "insuranceBought"
  | "circleContribution"
  | "circlePayout"
  | "circleDefault"
  | "trade"
  | "restart"
  | "other";

export interface MoneyMove {
  turn: number;
  playerId: PlayerId;
  reason: MoveReason;
  amount: number;
  cashAfter: number;
  assetId?: string;
  cardKey?: string;
  counterpartId?: PlayerId;
  count?: number;
}

export interface Statement {
  turn: number;
  playerId: PlayerId;
  cashBefore: number;
  cashAfter: number;
  income: IncomeBreakdown;
  expenses: ExpenseBreakdown;
  incomeTotal: number;
  expensesTotal: number;
  net: number;
  goal: number;
  missing: number;
}

export interface LogEvent extends GameEvent {
  counterpartId?: PlayerId;
  income?: number;
  expenses?: number;
}

export interface Explanation {
  moves: MoneyMove[];
  logEvents: LogEvent[];
  statement: Statement | null;
}

type Pusher = (playerId: PlayerId, reason: MoveReason, amount: number, rest?: Partial<MoneyMove>) => void;

function makeStatement(state: GameState, playerId: PlayerId, turn: number, cashBefore: number, income: IncomeBreakdown, expenses: ExpenseBreakdown, incomeTotal: number, expensesTotal: number): Statement {
  const goal = Math.max(expensesTotal, state.config.freedomTarget, 1);
  return {
    turn,
    playerId,
    cashBefore,
    cashAfter: cashBefore + incomeTotal - expensesTotal,
    income,
    expenses,
    incomeTotal,
    expensesTotal,
    net: incomeTotal - expensesTotal,
    goal,
    missing: Math.max(0, goal - incomeTotal)
  };
}

function pushTurnStart(push: Pusher, playerId: PlayerId, income: IncomeBreakdown, expenses: ExpenseBreakdown, incomeTotal: number, expensesTotal: number) {
  push(playerId, "income", incomeTotal, { count: income.lines.length });
  push(playerId, "living", -expenses.living);
  push(playerId, "restartSurcharge", -expenses.restartSurcharge);
  const interest = expenses.interest.reduce((sum, line) => sum + line.amount, 0);
  push(playerId, "interest", -interest, { count: expenses.interest.length });
  const premiums = expenses.insurance.reduce((sum, line) => sum + line.amount, 0);
  push(playerId, "insurance", -premiums, { count: expenses.insurance.length });
  const gap = expensesTotal - expenses.total;
  if (gap !== 0) push(playerId, "other", -gap);
}

export function openingStatement(state: GameState): { moves: MoneyMove[]; statement: Statement } {
  const player = state.players[state.currentPlayerIndex];
  if (!player) throw new Error("Invalid current player index");
  const income = incomeBreakdown(state, player.id);
  const expenses = expenseBreakdown(state, player.id);
  const cashBefore = player.cash - income.total + expenses.total;
  const moves: MoneyMove[] = [];
  let cash = cashBefore;
  const push: Pusher = (playerId, reason, amount, rest = {}) => {
    if (amount === 0) return;
    cash += amount;
    moves.push({ turn: state.turn, playerId, reason, amount, cashAfter: cash, ...rest });
  };
  pushTurnStart(push, player.id, income, expenses, income.total, expenses.total);
  return { moves, statement: makeStatement(state, player.id, state.turn, cashBefore, income, expenses, income.total, expenses.total) };
}

export function explainAction(before: GameState, action: Action, after: GameState, events: GameEvent[]): Explanation {
  const running = new Map(before.players.map(player => [player.id, player.cash]));
  const moves: MoneyMove[] = [];
  const logEvents: LogEvent[] = [];
  let statement: Statement | null = null;
  const push: Pusher = (playerId, reason, amount, rest = {}) => {
    if (amount === 0) return;
    const cash = (running.get(playerId) ?? 0) + amount;
    running.set(playerId, cash);
    moves.push({ turn: before.turn, playerId, reason, amount, cashAfter: cash, ...rest });
  };

  const mover = before.players[before.currentPlayerIndex];
  const circle = before.circle;
  const contributes = Boolean(
    action.type === "endTurn" && mover && circle
    && circle.members.length >= before.config.circleMinimumMembers
    && circle.members.includes(mover.id)
    && !circle.contributedThisRound.includes(mover.id)
  );
  const sequence: LogEvent[] = [...events];
  if (contributes && mover) {
    const synthetic: LogEvent = { type: "circle.contribution", playerId: mover.id, amount: before.config.circleContribution };
    const defaultAt = sequence.findIndex(event => event.type === "circle.default");
    const payoutAt = sequence.findIndex(event => event.type === "circle.payout");
    const incomeAt = sequence.findIndex(event => event.type === "turn.income");
    const at = defaultAt >= 0 ? defaultAt + 1 : payoutAt >= 0 ? payoutAt : incomeAt >= 0 ? incomeAt : sequence.length;
    sequence.splice(at, 0, synthetic);
  }

  for (const event of sequence) {
    const id = event.playerId ?? "";
    const amount = event.amount ?? 0;
    const rest = event.assetId ? { assetId: event.assetId } : {};
    if (event.type === "start.salary") push(id, "salary", amount);
    else if (event.type === "rent.paid") {
      const owner = before.ownedAssets.find(asset => asset.assetId === event.assetId)?.ownerId;
      push(id, "rentPaid", -amount, { ...rest, ...(owner ? { counterpartId: owner } : {}) });
      if (owner) push(owner, "rentReceived", amount, { ...rest, counterpartId: id });
      logEvents.push({ ...event, ...(owner ? { counterpartId: owner } : {}) });
      continue;
    } else if (event.type === "tax.paid") push(id, "tax", -amount);
    else if (event.type === "audit.paid") push(id, "auditFee", -amount);
    else if (event.type === "card.resolved") {
      if (event.cardKey && cashCards.has(event.cardKey)) push(id, "card", amount, { cardKey: event.cardKey });
    } else if (event.type === "asset.bought") push(id, "assetBought", -amount, rest);
    else if (event.type === "asset.upgraded") push(id, "assetUpgraded", -amount, rest);
    else if (event.type === "asset.sold") push(id, "assetSold", amount, rest);
    else if (event.type === "asset.forced_sale") push(id, "forcedSale", amount, rest);
    else if (event.type === "loan.taken") push(id, "loanTaken", amount);
    else if (event.type === "loan.repaid") push(id, "loanRepaid", -amount);
    else if (event.type === "loan.defaulted") push(id, "loanDefaulted", amount);
    else if (event.type === "insurance.bought") push(id, "insuranceBought", -amount);
    else if (event.type === "circle.default") push(id, "circleDefault", amount);
    else if (event.type === "circle.contribution") push(id, "circleContribution", -amount);
    else if (event.type === "circle.payout") push(id, "circlePayout", amount);
    else if (event.type === "trade.completed" && action.type === "proposeTrade") {
      const net = action.requestedCash - action.offeredCash;
      push(id, "trade", net, { counterpartId: action.otherPlayerId });
      push(action.otherPlayerId, "trade", -net, { counterpartId: id });
    } else if (event.type === "turn.income") {
      const expensesEvent = sequence.find(item => item.type === "turn.expenses" && item.playerId === event.playerId);
      const expensesTotal = expensesEvent?.amount ?? 0;
      const income = incomeBreakdown(before, id);
      const expenses = expenseBreakdown(before, id);
      const cashBefore = running.get(id) ?? 0;
      pushTurnStart((playerId, reason, delta, extra = {}) => push(playerId, reason, delta, { ...extra, turn: after.turn }), id, income, expenses, amount, expensesTotal);
      statement = makeStatement(after, id, after.turn, cashBefore, income, expenses, amount, expensesTotal);
      logEvents.push({ type: "turn.statement", playerId: id, amount: amount - expensesTotal, income: amount, expenses: expensesTotal });
      continue;
    } else if (event.type === "turn.expenses") continue;
    logEvents.push(event);
  }

  for (const player of after.players) {
    const previous = before.players.find(item => item.id === player.id);
    if (!previous) continue;
    const residual = player.cash - (running.get(player.id) ?? previous.cash);
    if (residual !== 0) push(player.id, events.some(event => event.type === "player.restarted" && event.playerId === player.id) ? "restart" : "other", residual);
  }
  return { moves, logEvents, statement };
}
