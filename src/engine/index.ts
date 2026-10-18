import boardData from "../data/board.json";
import eventData from "../data/events.json";
import opportunityData from "../data/opportunities.json";
import type {
  Action,
  BoardSpace,
  CardEffect,
  GameCard,
  GameConfig,
  GameEvent,
  GameState,
  InsuranceType,
  Loan,
  OwnedAsset,
  PlayerId,
  PlayerState
} from "./types";
export type * from "./types";

const board = boardData as BoardSpace[];
const eventDeck = eventData as GameCard[];
const opportunities = opportunityData as GameCard[];
const insuranceTypes: InsuranceType[] = ["property", "health", "harvest", "breakdown"];

function random(state: GameState): { value: number; randomState: number } {
  let t = (state.randomState + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, randomState: (state.randomState + 0x6d2b79f5) >>> 0 };
}

function shuffled<T>(items: T[], state: GameState): { items: T[]; randomState: number } {
  const result = [...items];
  let randomState = state.randomState;
  for (let i = result.length - 1; i > 0; i -= 1) {
    const next = { ...state, randomState };
    const draw = random(next);
    randomState = draw.randomState;
    const j = Math.floor(draw.value * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return { items: result, randomState };
}

function currentPlayer(state: GameState): PlayerState {
  const player = state.players[state.currentPlayerIndex];
  if (!player) throw new Error("Invalid current player index");
  return player;
}

function assetSpace(state: GameState, assetId: string): BoardSpace {
  const space = state.spaces.find(candidate => candidate.assetId === assetId);
  if (!space) throw new Error("Unknown asset");
  return space;
}

function passiveIncome(state: GameState, player: PlayerState): number {
  const familyCounts = new Map<string, number>();
  for (const owned of player.assets) {
    const family = assetSpace(state, owned.assetId).family;
    if (family) familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
  }
  return player.assets.reduce((total, owned) => {
    const space = assetSpace(state, owned.assetId);
    const effect = state.marketEffects.find(item => item.family === space.family);
    const familyBonus = space.family && familyCounts.get(space.family) === 4 ? 1 + state.config.familyBonus : 1;
    return total + (space.baseIncome ?? 0) * owned.level * (effect?.multiplier ?? 1) * familyBonus;
  }, 0);
}

function rentDue(state: GameState, owned: OwnedAsset): number {
  const space = assetSpace(state, owned.assetId);
  const owner = state.players.find(player => player.id === owned.ownerId);
  const familyCount = owner?.assets.filter(asset => assetSpace(state, asset.assetId).family === space.family).length ?? 0;
  const familyBonus = space.family && familyCount === 4 ? 1 + state.config.familyBonus : 1;
  const marketMultiplier = state.marketEffects.find(effect => effect.family === space.family)?.multiplier ?? 1;
  const baseRent = space.rent ?? (space.baseIncome ?? 0) * state.config.rentBaselineRatio;
  return Math.floor(baseRent * owned.level * familyBonus * marketMultiplier * state.config.rentRatio / state.config.rentBaselineRatio);
}

function assetValue(state: GameState, asset: OwnedAsset): number {
  return (assetSpace(state, asset.assetId).price ?? 0) + (asset.level > 1 ? (assetSpace(state, asset.assetId).upgradeCosts ?? [0, 0]).slice(0, asset.level - 1).reduce((a, b) => a + b, 0) : 0);
}

function debt(state: GameState, player: PlayerState): number {
  return player.loans.reduce((sum, loan) => sum + loan.principal, 0);
}

function creditLimit(state: GameState, player: PlayerState): number {
  return Math.floor(player.assets.reduce((sum, asset) => sum + assetValue(state, asset), 0) * state.config.maxLoanToAssetValue);
}

function loanRate(state: GameState, player: PlayerState): number {
  return state.config.loanInterest + (player.reputation < 0 ? state.config.lowReputationSurcharge : 0);
}

function availableBorrowing(state: GameState, player: PlayerState): number {
  return Math.max(0, creditLimit(state, player) - debt(state, player));
}

function loanAmountAllowed(state: GameState, player: PlayerState, amount: number): boolean {
  return amount > 0 && amount % state.config.loanTranche === 0 && amount <= availableBorrowing(state, player);
}

function tradeValid(state: GameState, player: PlayerState, action: Extract<Action, { type: "proposeTrade" }>): boolean {
  if (!action.accepted || action.otherPlayerId === player.id || action.offeredCash < 0 || action.requestedCash < 0 || player.cash < action.offeredCash) return false;
  const other = state.players.find(item => item.id === action.otherPlayerId);
  if (!other || other.cash < action.requestedCash) return false;
  const offered = action.offeredAssetId ? player.assets.some(asset => asset.assetId === action.offeredAssetId) : false;
  const requested = action.requestedAssetId ? other.assets.some(asset => asset.assetId === action.requestedAssetId) : false;
  return (offered || requested || action.offeredCash > 0 || action.requestedCash > 0) && (!action.offeredAssetId || offered) && (!action.requestedAssetId || requested);
}

export function createGame(config: GameConfig, seed: number): GameState {
  if (!Number.isInteger(seed)) throw new Error("Seed must be an integer");
  const count = config.playerCount ?? 2;
  if (count < 2 || count > 4) throw new Error("Player count must be between 2 and 4");
  if (config.playerTypes && config.playerTypes.length !== count) throw new Error("Player types must match the player count");
  if (config.botLevels && config.botLevels.length !== count) throw new Error("Bot levels must match the player count");
  const players: PlayerState[] = Array.from({ length: count }, (_, index) => ({
    id: `player-${index + 1}`,
    isBot: config.playerTypes ? config.playerTypes[index] === "bot" : index > 0,
    botLevel: config.botLevels?.[index] ?? (index > 0 ? 2 : 1),
    cash: config.startingCash + index * config.seatCashBonus,
    assets: [],
    loans: [],
    insurance: [],
    baseExpenses: config.baseExpenses,
    reputation: 0,
    position: 0,
    turnsPlayed: 0,
    freedomStreak: 0,
    restartExpenseTurns: 0,
    salaryBonusTurns: 0,
    salaryBonus: 0,
    assetDiscount: 1,
    auditTurns: 0
  }));
  const initial: GameState = {
    config: {
      ...config,
      ...(config.playerTypes ? { playerTypes: [...config.playerTypes] } : {}),
      ...(config.botLevels ? { botLevels: [...config.botLevels] } : {})
    },
    players,
    currentPlayerIndex: 0,
    turn: 0,
    phase: "roll",
    spaces: board as BoardSpace[],
    ownedAssets: [],
    circle: null,
    marketEffects: [],
    randomState: seed >>> 0,
    pendingBank: false,
    pendingOpportunity: false,
    winner: null,
    endReason: null
  };
  return advanceStart(initial, 0).state;
}

export function auditOffice(spaces: BoardSpace[]): number {
  const office = spaces.findIndex(space => space.office);
  if (office >= 0) return office;
  const rest = spaces.map(space => space.type).lastIndexOf("rest");
  return rest >= 0 ? rest : 0;
}

export function isHeld(player: PlayerState): boolean {
  return (player.auditTurns ?? 0) > 0;
}

function managementActions(state: GameState, player: PlayerState): Action[] {
  const actions: Action[] = [];
  for (const owned of player.assets) {
    if (owned.level < 3) {
      const cost = (assetSpace(state, owned.assetId).upgradeCosts ?? [])[owned.level - 1];
      if (cost !== undefined && player.cash >= cost) actions.push({ type: "upgradeAsset", assetId: owned.assetId });
    }
  }
  for (const owned of player.assets) actions.push({ type: "sellAsset", assetId: owned.assetId });
  const maximumLoan = availableBorrowing(state, player);
  for (let amount = state.config.loanTranche; amount <= maximumLoan; amount += state.config.loanTranche) {
    if (loanAmountAllowed(state, player, amount)) actions.push({ type: "takeLoan", amount });
  }
  for (const amount of [...new Set(player.loans.map(loan => Math.min(loan.principal, Math.floor(player.cash / state.config.loanTranche) * state.config.loanTranche)))]) {
    if (amount > 0) actions.push({ type: "repayLoan", amount });
  }
  return actions;
}

export function legalActions(state: GameState): Action[] {
  if (state.phase === "finished") return [];
  const player = currentPlayer(state);
  if (state.phase === "roll") {
    const opening: Action[] = isHeld(player)
      ? [...(player.cash >= state.config.auditFee ? [{ type: "payAudit" } as const] : []), { type: "waitAudit" }]
      : [{ type: "roll" }];
    return [...opening, ...managementActions(state, player)];
  }
  const actions: Action[] = [];
  const position = player.position;
  const space = state.spaces[position];
  if (space?.type === "asset" && space.assetId && !state.ownedAssets.some(asset => asset.assetId === space.assetId) && player.cash >= Math.ceil((space.price ?? Infinity) * player.assetDiscount)) {
    actions.push({ type: "buyAsset" });
  }
  actions.push(...managementActions(state, player));
  for (const insuranceType of insuranceTypes) {
    if (!player.insurance.includes(insuranceType) && player.cash >= state.config.insurancePremium) actions.push({ type: "buyInsurance", insuranceType });
  }
  if (space?.type === "circle" && player.reputation >= 0 && (state.circle === null || (state.circle.roundsCompleted === 0 && state.circle.contributedThisRound.length === 0 && state.circle.members.length < state.config.circleMaximumMembers && !state.circle.members.includes(player.id)))) {
    actions.push({ type: "joinCircle" });
  }
  for (const other of state.players) {
    if (other.id === player.id) continue;
    const proposeTrade = (details: Omit<Extract<Action, { type: "proposeTrade" }>, "type" | "otherPlayerId" | "accepted">) => {
      actions.push(
        { type: "proposeTrade", otherPlayerId: other.id, ...details, accepted: true },
        { type: "proposeTrade", otherPlayerId: other.id, ...details, accepted: false }
      );
    };
    for (const offered of player.assets) {
      for (const requested of other.assets) {
        proposeTrade({ offeredAssetId: offered.assetId, requestedAssetId: requested.assetId, offeredCash: 0, requestedCash: 0 });
      }
      for (let amount = state.config.loanTranche; amount <= other.cash; amount += state.config.loanTranche) {
        proposeTrade({ offeredAssetId: offered.assetId, offeredCash: 0, requestedCash: amount });
      }
    }
    for (const requested of other.assets) {
      for (let amount = state.config.loanTranche; amount <= player.cash; amount += state.config.loanTranche) {
        proposeTrade({ requestedAssetId: requested.assetId, offeredCash: amount, requestedCash: 0 });
      }
    }
    for (let amount = state.config.loanTranche; amount <= player.cash; amount += state.config.loanTranche) {
      proposeTrade({ offeredCash: amount, requestedCash: 0 });
    }
    for (let amount = state.config.loanTranche; amount <= other.cash; amount += state.config.loanTranche) {
      proposeTrade({ offeredCash: 0, requestedCash: amount });
    }
  }
  actions.push({ type: "endTurn" });
  return actions;
}

function winnerAtLimit(state: GameState): PlayerId | null {
  if (state.winner) return state.winner;
  if (state.turn < state.config.maxTurns) return null;
  const ranked = [...state.players].sort((a, b) => netWorth(state, b) - netWorth(state, a));
  return ranked[0]?.id ?? null;
}

function netWorth(state: GameState, player: PlayerState): number {
  return player.cash + player.assets.reduce((total, asset) => total + assetValue(state, asset), 0) - debt(state, player);
}

function applyCard(state: GameState, player: PlayerState, card: GameCard): { state: GameState; events: GameEvent[] } {
  const effect: CardEffect = card.effect;
  let updatedPlayer = player;
  let updatedState = state;
  let amount = effect.amount ?? 0;
  if (effect.type === "cash") {
    if (amount < 0 && card.insuranceType && player.insurance.includes(card.insuranceType)) amount = Math.ceil(amount * (1 - state.config.insuranceCoverage));
    updatedPlayer = { ...player, cash: player.cash + amount };
  } else if (effect.type === "salary_bonus") {
    updatedPlayer = { ...player, salaryBonus: amount, salaryBonusTurns: effect.turns ?? 1 };
  } else if (effect.type === "base_expenses") {
    updatedPlayer = { ...player, baseExpenses: Math.max(0, player.baseExpenses + amount) };
  } else if (effect.type === "asset_discount") {
    if (effect.multiplier === undefined) throw new Error("Asset discount card is missing its multiplier");
    updatedPlayer = { ...player, assetDiscount: effect.multiplier };
  } else if (effect.type === "asset_multiplier" && effect.family && effect.multiplier !== undefined) {
    updatedState = { ...state, marketEffects: [...state.marketEffects.filter(item => item.family !== effect.family), { family: effect.family, multiplier: effect.multiplier, turnsRemaining: effect.turns ?? 3 }] };
  }
  return {
    state: { ...updatedState, players: updatedState.players.map(item => item.id === player.id ? updatedPlayer : item) },
    events: [{ type: "card.resolved", playerId: player.id, amount, cardKey: card.id }, { type: card.titleKey, playerId: player.id }]
  };
}

function resolveBankruptcy(state: GameState, player: PlayerState): { state: GameState; events: GameEvent[] } {
  let updated = state;
  let updatedPlayer = player;
  const emitted: GameEvent[] = [];
  while (updatedPlayer.cash < 0 && availableBorrowing(updated, updatedPlayer) >= updated.config.loanTranche) {
    const amount = Math.min(Math.ceil(-updatedPlayer.cash / updated.config.loanTranche) * updated.config.loanTranche, Math.floor(availableBorrowing(updated, updatedPlayer) / updated.config.loanTranche) * updated.config.loanTranche);
    if (amount <= 0) break;
    updatedPlayer = { ...updatedPlayer, cash: updatedPlayer.cash + amount, loans: [...updatedPlayer.loans, { principal: amount, interestRate: updated.config.defaultLoanInterest }], reputation: updatedPlayer.reputation - 1 };
    emitted.push({ type: "loan.defaulted", playerId: player.id, amount });
  }
  if (updatedPlayer.cash < 0) {
    for (const owned of [...updatedPlayer.assets]) {
      if (updatedPlayer.cash >= 0) break;
      const proceeds = Math.floor(assetValue(updated, owned) * updated.config.forcedSaleRatio);
      updatedPlayer = { ...updatedPlayer, cash: updatedPlayer.cash + proceeds, assets: updatedPlayer.assets.filter(asset => asset.assetId !== owned.assetId) };
      updated = { ...updated, ownedAssets: updated.ownedAssets.filter(asset => asset.assetId !== owned.assetId) };
      emitted.push({ type: "asset.forced_sale", playerId: player.id, amount: proceeds, assetId: owned.assetId });
    }
  }
  if (updatedPlayer.cash < 0) {
    updatedPlayer = {
      ...updatedPlayer,
      cash: updated.config.restartCash,
      assets: [],
      loans: [{ principal: updated.config.restartCash, interestRate: 0 }],
      baseExpenses: Math.ceil(updatedPlayer.baseExpenses * updated.config.restartExpenseMultiplier),
      restartExpenseTurns: updated.config.restartExpenseTurns,
      assetDiscount: 1,
      reputation: updatedPlayer.reputation - 1
    };
    updated = { ...updated, ownedAssets: updated.ownedAssets.filter(asset => asset.ownerId !== player.id) };
    emitted.push({ type: "player.restarted", playerId: player.id, amount: updated.config.restartCash });
  }
  return { state: { ...updated, players: updated.players.map(item => item.id === player.id ? updatedPlayer : item) }, events: emitted };
}

function advanceStart(state: GameState, playerIndex: number): { state: GameState; events: GameEvent[] } {
  let updated = state;
  let player = updated.players[playerIndex];
  if (!player) throw new Error("Invalid player index");
  const income = Math.floor(passiveIncome(updated, player));
  const interest = player.loans.reduce((sum, loan) => sum + Math.ceil(loan.principal * loan.interestRate), 0);
  const premiums = player.insurance.length * updated.config.insurancePremium;
  const expenses = player.baseExpenses + interest + premiums;
  player = { ...player, cash: player.cash + income - expenses, turnsPlayed: player.turnsPlayed + 1, restartExpenseTurns: Math.max(0, player.restartExpenseTurns - 1) };
  if (player.restartExpenseTurns === 0 && player.baseExpenses !== updated.config.baseExpenses && updated.players[playerIndex]?.restartExpenseTurns === 1) {
    player = { ...player, baseExpenses: updated.config.baseExpenses };
  }
  if (player.cash < 0) player = { ...player, freedomStreak: 0 };
  const marketEffects = updated.turn > 0
    ? updated.marketEffects.map(effect => ({ ...effect, turnsRemaining: effect.turnsRemaining - 1 })).filter(effect => effect.turnsRemaining > 0)
    : updated.marketEffects;
  updated = { ...updated, players: updated.players.map((item, index) => index === playerIndex ? player : item), marketEffects };
  const bankrupt = resolveBankruptcy(updated, player);
  return { state: bankrupt.state,   events: [{ type: "turn.income", playerId: player.id, amount: income }, { type: "turn.expenses", playerId: player.id, amount: expenses }, ...bankrupt.events] };
}

function processCircle(state: GameState, player: PlayerState): { state: GameState; events: GameEvent[] } {
  const circle = state.circle;
  if (!circle || circle.members.length < state.config.circleMinimumMembers || !circle.members.includes(player.id) || circle.contributedThisRound.includes(player.id)) return { state, events: [] };
  let updatedPlayer = player;
  let updatedCircle = { ...circle, contributedThisRound: [...circle.contributedThisRound, player.id], pot: circle.pot + state.config.circleContribution };
  const events: GameEvent[] = [];
  if (player.cash < state.config.circleContribution) {
    const borrowed = state.config.circleContribution - player.cash;
    updatedPlayer = { ...player, cash: player.cash + borrowed, loans: [...player.loans, { principal: borrowed, interestRate: state.config.defaultLoanInterest }], reputation: player.reputation - 1 };
    events.push({ type: "circle.default", playerId: player.id, amount: borrowed });
  }
  updatedPlayer = { ...updatedPlayer, cash: updatedPlayer.cash - state.config.circleContribution };
  let updatedState: GameState = { ...state, players: state.players.map(item => item.id === player.id ? updatedPlayer : item), circle: updatedCircle };
  if (updatedCircle.contributedThisRound.length >= updatedCircle.members.length) {
    const recipientId = updatedCircle.receiverOrder[updatedCircle.nextReceiver];
    if (recipientId) {
      const recipient = updatedState.players.find(item => item.id === recipientId);
      if (recipient) updatedState = { ...updatedState, players: updatedState.players.map(item => item.id === recipientId ? { ...item, cash: item.cash + updatedCircle.pot } : item) };
      events.push({ type: "circle.payout", playerId: recipientId, amount: updatedCircle.pot });
    }
    const next = updatedCircle.nextReceiver + 1;
    updatedCircle = { ...updatedCircle, nextReceiver: next, contributedThisRound: [], pot: 0, roundsCompleted: updatedCircle.roundsCompleted + 1 };
    updatedState = { ...updatedState, circle: next >= updatedCircle.receiverOrder.length ? null : updatedCircle };
  }
  return { state: updatedState, events };
}

function applyActionInternal(state: GameState, action: Action): { state: GameState; events: GameEvent[] } {
  const player = currentPlayer(state);
  const valid = legalActions(state).some(candidate => JSON.stringify(candidate) === JSON.stringify(action));
  if (!valid) throw new Error("Illegal action");
  if (action.type === "roll") {
    const first = random(state);
    const second = random({ ...state, randomState: first.randomState });
    const dice: [number, number] = [Math.floor(first.value * 6) + 1, Math.floor(second.value * 6) + 1];
    const move = dice[0] + dice[1];
    const raw = player.position + move;
    const passedStart = raw >= state.spaces.length;
    const position = raw % state.spaces.length;
    const space = state.spaces[position];
    let updatedPlayer = { ...player, position };
    let updated: GameState = { ...state, players: state.players.map(item => item.id === player.id ? updatedPlayer : item), randomState: second.randomState, phase: "actions", pendingBank: space?.type === "bank", pendingOpportunity: space?.type === "opportunity" };
    const emitted: GameEvent[] = [{ type: "dice.rolled", playerId: player.id, amount: move, dice }, { type: "space.landed", playerId: player.id, amount: position }];
    if (passedStart) {
      const salary = player.turnsPlayed >= state.config.salaryReductionAfterTurns
        ? Math.max(0, state.config.salary - state.config.salaryReduction + player.salaryBonus)
        : state.config.salary + player.salaryBonus;
      updatedPlayer = { ...updatedPlayer, cash: updatedPlayer.cash + salary };
      updated = { ...updated, players: updated.players.map(item => item.id === player.id ? updatedPlayer : item) };
      emitted.push({ type: "start.salary", playerId: player.id, amount: salary });
    }
    if (space?.type === "asset" && space.assetId) {
      const owned = state.ownedAssets.find(asset => asset.assetId === space.assetId);
      if (owned && owned.ownerId !== player.id) {
        const payer = updated.players[state.currentPlayerIndex];
        const recipient = updated.players.find(item => item.id === owned.ownerId);
        if (payer && recipient) {
          const rent = rentDue(updated, owned);
          updated = { ...updated, players: updated.players.map(item => item.id === payer.id ? { ...item, cash: item.cash - rent } : item.id === recipient.id ? { ...item, cash: item.cash + rent } : item) };
          emitted.push({ type: "rent.paid", playerId: player.id, amount: rent, assetId: space.assetId });
        }
      }
    } else if (space?.type === "tax") {
      updatedPlayer = updated.players[state.currentPlayerIndex] as PlayerState;
      const paid = space.amount ?? 0;
      updated = { ...updated, players: updated.players.map(item => item.id === player.id ? { ...item, cash: item.cash - paid } : item) };
      emitted.push({ type: "tax.paid", playerId: player.id, amount: paid });
    } else if (space?.type === "audit") {
      const office = auditOffice(state.spaces);
      updated = { ...updated, pendingBank: false, players: updated.players.map(item => item.id === player.id ? { ...item, position: office, auditTurns: state.config.auditTurns } : item) };
      emitted.push({ type: "audit.sent", playerId: player.id, amount: office });
    } else if (space?.type === "event" || space?.type === "opportunity") {
      const deck = space.type === "event" ? eventDeck : opportunities;
      const draw = random(updated);
      const card = deck[Math.floor(draw.value * deck.length)];
      if (card) {
        const applied = applyCard({ ...updated, randomState: draw.randomState }, updated.players[state.currentPlayerIndex] as PlayerState, card);
        updated = applied.state;
        emitted.push(...applied.events);
      }
    }
    const bankrupt = resolveBankruptcy(updated, updated.players[state.currentPlayerIndex] as PlayerState);
    return { state: bankrupt.state, events: [...emitted, ...bankrupt.events] };
  }

  let updated: GameState = state;
  const events: GameEvent[] = [];
  if (action.type === "payAudit") {
    updated = { ...state, players: state.players.map(item => item.id === player.id ? { ...item, cash: item.cash - state.config.auditFee, auditTurns: 0 } : item) };
    events.push({ type: "audit.paid", playerId: player.id, amount: state.config.auditFee });
  } else if (action.type === "waitAudit") {
    const remaining = Math.max(0, player.auditTurns - 1);
    updated = { ...state, phase: "actions", pendingBank: false, pendingOpportunity: false, players: state.players.map(item => item.id === player.id ? { ...item, auditTurns: remaining } : item) };
    events.push({ type: "audit.waited", playerId: player.id, amount: remaining });
    if (remaining === 0) events.push({ type: "audit.released", playerId: player.id });
  } else if (action.type === "buyAsset") {
    const space = state.spaces[player.position];
    if (!space?.assetId) throw new Error("No asset on current space");
    const price = Math.ceil((space.price ?? 0) * player.assetDiscount);
    const owned: OwnedAsset = { assetId: space.assetId, ownerId: player.id, level: 1 };
    updated = { ...state, players: state.players.map(item => item.id === player.id ? { ...item, cash: item.cash - price, assets: [...item.assets, owned], assetDiscount: 1 } : item), ownedAssets: [...state.ownedAssets, owned] };
    events.push({ type: "asset.bought", playerId: player.id, assetId: owned.assetId, amount: price });
  } else if (action.type === "upgradeAsset") {
    const owned = player.assets.find(asset => asset.assetId === action.assetId);
    if (!owned) throw new Error("Asset not owned");
    const cost = (assetSpace(state, owned.assetId).upgradeCosts ?? [])[owned.level - 1] ?? 0;
    const replacement = { ...owned, level: (owned.level + 1) as 2 | 3 };
    updated = { ...state, players: state.players.map(item => item.id === player.id ? { ...item, cash: item.cash - cost, assets: item.assets.map(asset => asset.assetId === owned.assetId ? replacement : asset) } : item), ownedAssets: state.ownedAssets.map(asset => asset.assetId === owned.assetId ? replacement : asset) };
    events.push({ type: "asset.upgraded", playerId: player.id, assetId: action.assetId, amount: cost });
  } else if (action.type === "sellAsset") {
    const owned = player.assets.find(asset => asset.assetId === action.assetId);
    if (!owned) throw new Error("Asset not owned");
    const proceeds = Math.floor(assetValue(state, owned) * state.config.voluntarySaleRatio);
    updated = { ...state, players: state.players.map(item => item.id === player.id ? { ...item, cash: item.cash + proceeds, assets: item.assets.filter(asset => asset.assetId !== owned.assetId) } : item), ownedAssets: state.ownedAssets.filter(asset => asset.assetId !== owned.assetId) };
    events.push({ type: "asset.sold", playerId: player.id, assetId: action.assetId, amount: proceeds });
  } else if (action.type === "takeLoan") {
    const loan: Loan = { principal: action.amount, interestRate: loanRate(state, player) };
    updated = { ...state, players: state.players.map(item => item.id === player.id ? { ...item, cash: item.cash + action.amount, loans: [...item.loans, loan] } : item) };
    events.push({ type: "loan.taken", playerId: player.id, amount: action.amount });
  } else if (action.type === "repayLoan") {
    let remaining = action.amount;
    const loans: Loan[] = [];
    for (const loan of player.loans) {
      const paid = Math.min(remaining, loan.principal);
      remaining -= paid;
      if (loan.principal > paid) loans.push({ ...loan, principal: loan.principal - paid });
    }
    updated = { ...state, players: state.players.map(item => item.id === player.id ? { ...item, cash: item.cash - action.amount, loans } : item) };
    events.push({ type: "loan.repaid", playerId: player.id, amount: action.amount });
  } else if (action.type === "buyInsurance") {
    updated = { ...state, players: state.players.map(item => item.id === player.id ? { ...item, cash: item.cash - state.config.insurancePremium, insurance: [...item.insurance, action.insuranceType] } : item) };
    events.push({ type: "insurance.bought", playerId: player.id, amount: state.config.insurancePremium });
  } else if (action.type === "joinCircle") {
    if (!state.circle) {
      const members = [player.id];
      const draw = shuffled(members, state);
      updated = { ...state, circle: { members, receiverOrder: draw.items, nextReceiver: 0, contributedThisRound: [], pot: 0, roundsCompleted: 0 }, randomState: draw.randomState };
    } else {
      const members = [...state.circle.members, player.id];
      const draw = shuffled(members, state);
      updated = { ...state, circle: { ...state.circle, members, receiverOrder: draw.items }, randomState: draw.randomState };
    }
    events.push({ type: "circle.joined", playerId: player.id });
  } else if (action.type === "proposeTrade") {
    if (tradeValid(state, player, action)) {
      const other = state.players.find(item => item.id === action.otherPlayerId);
      if (other) {
        const offered = action.offeredAssetId ? player.assets.find(asset => asset.assetId === action.offeredAssetId) : undefined;
        const requested = action.requestedAssetId ? other.assets.find(asset => asset.assetId === action.requestedAssetId) : undefined;
        const offeredToOther = offered ? { ...offered, ownerId: other.id } : undefined;
        const requestedToPlayer = requested ? { ...requested, ownerId: player.id } : undefined;
        const updatedOwnedAssets = state.ownedAssets.map(asset => {
          if (offered && asset.assetId === offered.assetId) return { ...asset, ownerId: other.id };
          if (requested && asset.assetId === requested.assetId) return { ...asset, ownerId: player.id };
          return asset;
        });
        updated = {
          ...state,
          players: state.players.map(item => item.id === player.id
            ? {
              ...item,
              cash: item.cash - action.offeredCash + action.requestedCash,
              assets: [
                ...item.assets.filter(asset => asset.assetId !== action.offeredAssetId),
                ...(requestedToPlayer ? [requestedToPlayer] : [])
              ]
            }
            : item.id === other.id ? {
              ...item,
              cash: item.cash + action.offeredCash - action.requestedCash,
              assets: [
                ...item.assets.filter(asset => asset.assetId !== action.requestedAssetId),
                ...(offeredToOther ? [offeredToOther] : [])
              ]
            } : item),
          ownedAssets: updatedOwnedAssets
        };
        events.push({ type: "trade.completed", playerId: player.id });
      } else events.push({ type: "trade.declined", playerId: player.id });
    } else events.push({ type: "trade.declined", playerId: player.id });
  } else if (action.type === "endTurn") {
    const solvent = resolveBankruptcy(state, player);
    const circle = processCircle(solvent.state, solvent.state.players[state.currentPlayerIndex] as PlayerState);
    updated = circle.state;
    events.push(...solvent.events, ...circle.events);
    const completedPlayer = updated.players[state.currentPlayerIndex];
    if (completedPlayer) {
      const income = passiveIncome(updated, completedPlayer);
      const expenses = completedPlayer.baseExpenses
        + completedPlayer.loans.reduce((sum, loan) => sum + Math.ceil(loan.principal * loan.interestRate), 0)
        + completedPlayer.insurance.length * updated.config.insurancePremium;
      const isFree = income >= Math.max(expenses, updated.config.freedomTarget) && completedPlayer.cash >= 0;
      const streak = isFree ? completedPlayer.freedomStreak + 1 : 0;
      updated = { ...updated, players: updated.players.map(item => item.id === completedPlayer.id ? {
        ...item,
        freedomStreak: streak,
        salaryBonusTurns: Math.max(0, item.salaryBonusTurns - 1),
        salaryBonus: item.salaryBonusTurns > 1 ? item.salaryBonus : 0
      } : item) };
      if (streak >= updated.config.freedomTurns) updated = { ...updated, winner: completedPlayer.id, endReason: "freedom", phase: "finished" };
    }
    if (updated.winner) return { state: updated, events };
    const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    const nextTurn = state.turn + 1;
    updated = { ...updated, currentPlayerIndex: nextIndex, turn: nextTurn, phase: "roll", pendingBank: false, pendingOpportunity: false };
    if (nextTurn >= updated.config.maxTurns) {
      const ranked = [...updated.players].sort((a, b) => netWorth(updated, b) - netWorth(updated, a));
      updated = { ...updated, winner: ranked[0]?.id ?? null, endReason: "turn_limit", phase: "finished" };
      return { state: updated, events };
    }
    const advanced = advanceStart(updated, nextIndex);
    updated = advanced.state;
    events.push(...advanced.events);
    return { state: updated, events };
  }
  const bankrupt = resolveBankruptcy(updated, updated.players[state.currentPlayerIndex] as PlayerState);
  return { state: bankrupt.state, events: [...events, ...bankrupt.events] };
}

export function applyAction(state: GameState, action: Action): { state: GameState; events: GameEvent[] } {
  return applyActionInternal(state, action);
}

export function getWinner(state: GameState): PlayerId | null {
  return winnerAtLimit(state);
}

export function chooseBotAction(state: GameState, level: 1 | 2 | 3): Action {
  const player = currentPlayer(state);
  const actions = legalActions(state);
  if (state.phase === "roll") {
    if (!isHeld(player)) return { type: "roll" };
    const canPay = actions.some(action => action.type === "payAudit");
    const cushion = state.config.baseExpenses * (level === 3 ? 3 : level === 2 ? 4 : 8);
    const freeAssets = state.spaces.filter(space => space.type === "asset" && !state.ownedAssets.some(owned => owned.assetId === space.assetId)).length;
    const worthLeaving = level < 3 || freeAssets >= 4;
    return canPay && worthLeaving && player.cash - state.config.auditFee >= cushion ? { type: "payAudit" } : { type: "waitAudit" };
  }
  const byType = (type: Action["type"]) => actions.filter(action => action.type === type);
  const upgradeReserve = level === 1 ? 14 : level === 2 ? 8 : 5;
  const upgrade = byType("upgradeAsset")[0];
  if (upgrade && player.cash > state.config.baseExpenses * upgradeReserve) return upgrade;
  if (level === 1) {
    const purchase = byType("buyAsset")[0];
    if (purchase) return purchase;
    return { type: "endTurn" };
  }
  const landingSpace = state.spaces[player.position];
  if (level >= 2 && player.assets.length > 0 && landingSpace?.type === "asset" && landingSpace.assetId && landingSpace.price !== undefined
    && !state.ownedAssets.some(asset => asset.assetId === landingSpace.assetId)
    && (landingSpace.baseIncome ?? 0) / (landingSpace.price * player.assetDiscount) > state.config.loanInterest * 1.5) {
    const reserve = state.config.baseExpenses * (level === 3 ? 2 : 3);
    const price = Math.ceil(landingSpace.price * player.assetDiscount);
    const minimumNeeded = Math.max(0, price + reserve - player.cash);
    const candidates = byType("takeLoan")
      .filter((action): action is Extract<Action, { type: "takeLoan" }> => action.type === "takeLoan" && minimumNeeded > 0 && action.amount >= minimumNeeded)
      .filter(action => level === 3 || action.amount <= state.config.loanTranche)
      .sort((a, b) => a.amount - b.amount);
    const loan = candidates[0];
    if (loan) return loan;
  }
  const purchase = byType("buyAsset")[0];
  if (purchase) {
    const space = state.spaces[player.position];
    const price = Math.ceil((space?.price ?? Infinity) * player.assetDiscount);
    const income = space?.baseIncome ?? 0;
    const canInvest = player.cash - price >= state.config.baseExpenses * (level === 3 ? 2 : level === 2 ? 1.5 : 1);
    const profitable = income / Math.max(1, price) >= (level === 3 ? 0.045 : 0.055);
    if (canInvest && profitable) return purchase;
  }
  if (level >= 2 && player.assets.length > 0) {
    const insurance = byType("buyInsurance").find(action => action.type === "buyInsurance" && action.insuranceType === "property");
    if (insurance && player.cash > state.config.baseExpenses * 4 && !player.insurance.includes("property")) return insurance;
  }
  const repay = byType("repayLoan")[0];
  if (repay && player.cash > state.config.baseExpenses * 6 && (repay.type !== "repayLoan" || repay.amount > 0)) return repay;
  const circle = byType("joinCircle")[0];
  if (circle && state.circle && player.cash > state.config.circleContribution * 3) return circle;
  return { type: "endTurn" };
}

export interface PlayerSummary {
  income: number;
  expenses: number;
  netWorth: number;
  debt: number;
  freedomTarget: number;
}

export function playerSummary(state: GameState, playerId: PlayerId): PlayerSummary {
  const player = state.players.find(item => item.id === playerId);
  if (!player) throw new Error("Unknown player");
  return {
    income: Math.round(passiveIncome(state, player)),
    expenses: player.baseExpenses
      + player.loans.reduce((sum, loan) => sum + Math.ceil(loan.principal * loan.interestRate), 0)
      + player.insurance.length * state.config.insurancePremium,
    netWorth: Math.round(netWorth(state, player)),
    debt: player.loans.reduce((sum, loan) => sum + loan.principal, 0),
    freedomTarget: state.config.freedomTarget
  };
}

export interface IncomeLine {
  assetId: string;
  level: 1 | 2 | 3;
  baseIncome: number;
  marketMultiplier: number;
  familyBonusApplied: boolean;
  amount: number;
  exact: number;
}

export interface IncomeBreakdown {
  lines: IncomeLine[];
  total: number;
}

export interface LoanInterestLine {
  principal: number;
  rate: number;
  amount: number;
}

export interface InsuranceLine {
  type: InsuranceType;
  amount: number;
}

export interface ExpenseBreakdown {
  living: number;
  restartSurcharge: number;
  restartTurnsLeft: number;
  interest: LoanInterestLine[];
  insurance: InsuranceLine[];
  total: number;
}

export interface SalaryPreview {
  amount: number;
  base: number;
  reduction: number;
  bonus: number;
  bonusTurns: number;
  reduced: boolean;
  reducedAfterTurns: number;
  turnsBeforeReduction: number;
}

function requirePlayer(state: GameState, playerId: PlayerId): PlayerState {
  const player = state.players.find(item => item.id === playerId);
  if (!player) throw new Error("Unknown player");
  return player;
}

export function incomeBreakdown(state: GameState, playerId: PlayerId): IncomeBreakdown {
  const player = requirePlayer(state, playerId);
  const familyCounts = new Map<string, number>();
  for (const owned of player.assets) {
    const family = assetSpace(state, owned.assetId).family;
    if (family) familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
  }
  let running = 0;
  let allotted = 0;
  const lines = player.assets.map(owned => {
    const space = assetSpace(state, owned.assetId);
    const marketMultiplier = state.marketEffects.find(item => item.family === space.family)?.multiplier ?? 1;
    const familyBonusApplied = Boolean(space.family && familyCounts.get(space.family) === 4);
    const exact = (space.baseIncome ?? 0) * owned.level * marketMultiplier * (familyBonusApplied ? 1 + state.config.familyBonus : 1);
    running += exact;
    const amount = Math.floor(running) - allotted;
    allotted += amount;
    return { assetId: owned.assetId, level: owned.level, baseIncome: space.baseIncome ?? 0, marketMultiplier, familyBonusApplied, amount, exact };
  });
  return { lines, total: Math.floor(passiveIncome(state, player)) };
}

export function expenseBreakdown(state: GameState, playerId: PlayerId): ExpenseBreakdown {
  const player = requirePlayer(state, playerId);
  const surcharge = player.restartExpenseTurns > 0
    ? Math.max(0, player.baseExpenses - Math.floor(player.baseExpenses / state.config.restartExpenseMultiplier + 1e-9))
    : 0;
  const interest = player.loans.map(loan => ({ principal: loan.principal, rate: loan.interestRate, amount: Math.ceil(loan.principal * loan.interestRate) }));
  const insurance = player.insurance.map(type => ({ type, amount: state.config.insurancePremium }));
  const total = player.baseExpenses + interest.reduce((sum, line) => sum + line.amount, 0) + insurance.length * state.config.insurancePremium;
  return { living: player.baseExpenses - surcharge, restartSurcharge: surcharge, restartTurnsLeft: player.restartExpenseTurns, interest, insurance, total };
}

export function salaryPreview(state: GameState, playerId: PlayerId): SalaryPreview {
  const player = requirePlayer(state, playerId);
  const config = state.config;
  const current = state.players[state.currentPlayerIndex]?.id === playerId;
  const rollsThisTurn = current && state.phase === "roll";
  const endsTurnFirst = current && state.phase === "actions";
  const turnsPlayed = rollsThisTurn ? player.turnsPlayed : player.turnsPlayed + 1;
  const bonusTurns = endsTurnFirst ? Math.max(0, player.salaryBonusTurns - 1) : player.salaryBonusTurns;
  const bonus = endsTurnFirst && player.salaryBonusTurns <= 1 ? 0 : player.salaryBonus;
  const reduced = turnsPlayed >= config.salaryReductionAfterTurns;
  const amount = reduced ? Math.max(0, config.salary - config.salaryReduction + bonus) : config.salary + bonus;
  return {
    amount,
    base: config.salary,
    reduction: config.salaryReduction,
    bonus,
    bonusTurns,
    reduced,
    reducedAfterTurns: config.salaryReductionAfterTurns,
    turnsBeforeReduction: Math.max(0, config.salaryReductionAfterTurns - turnsPlayed)
  };
}

export function sellValue(state: GameState, owned: OwnedAsset): number {
  return Math.floor(assetValue(state, owned) * state.config.voluntarySaleRatio);
}

export function upgradeCost(state: GameState, owned: OwnedAsset): number {
  return (assetSpace(state, owned.assetId).upgradeCosts ?? [])[owned.level - 1] ?? 0;
}

export function buyPrice(state: GameState): number {
  const player = currentPlayer(state);
  return Math.ceil((state.spaces[player.position]?.price ?? 0) * player.assetDiscount);
}
