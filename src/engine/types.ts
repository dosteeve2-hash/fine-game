export type PlayerId = string;
export type GameMode = "quick" | "standard" | "long";
export type Family = "trade" | "agriculture" | "real_estate" | "transport" | "energy" | "technology";
export type InsuranceType = "property" | "health" | "harvest" | "breakdown";
export type SpaceType = "start" | "asset" | "circle" | "event" | "opportunity" | "tax" | "bank" | "rest" | "audit";

export interface GameConfig {
  mode: GameMode;
  playerCount?: 2 | 3 | 4;
  playerTypes?: Array<"human" | "bot">;
  botLevels?: Array<1 | 2 | 3>;
  startingCash: number;
  baseExpenses: number;
  salary: number;
  salaryReductionAfterTurns: number;
  salaryReduction: number;
  freedomTurns: number;
  freedomTarget: number;
  seatCashBonus: number;
  maxTurns: number;
  rentRatio: number;
  rentBaselineRatio: number;
  loanTranche: number;
  loanInterest: number;
  lowReputationSurcharge: number;
  maxLoanToAssetValue: number;
  defaultLoanInterest: number;
  insurancePremium: number;
  insuranceCoverage: number;
  familyBonus: number;
  forcedSaleRatio: number;
  voluntarySaleRatio: number;
  circleContribution: number;
  circleMinimumMembers: number;
  circleMaximumMembers: number;
  restartCash: number;
  restartExpenseTurns: number;
  restartExpenseMultiplier: number;
  auditFee: number;
  auditTurns: number;
}

export interface BoardSpace {
  type: SpaceType;
  titleKey: string;
  assetId?: string;
  family?: Family;
  price?: number;
  baseIncome?: number;
  rent?: number;
  upgradeCosts?: [number, number];
  amount?: number;
  office?: boolean;
}

export interface OwnedAsset {
  assetId: string;
  ownerId: PlayerId;
  level: 1 | 2 | 3;
}

export interface Loan {
  principal: number;
  interestRate: number;
}

export interface PlayerState {
  id: PlayerId;
  isBot: boolean;
  botLevel: 1 | 2 | 3;
  cash: number;
  assets: OwnedAsset[];
  loans: Loan[];
  insurance: InsuranceType[];
  baseExpenses: number;
  reputation: number;
  position: number;
  turnsPlayed: number;
  freedomStreak: number;
  restartExpenseTurns: number;
  salaryBonusTurns: number;
  salaryBonus: number;
  assetDiscount: number;
  auditTurns: number;
}

export interface CircleState {
  members: PlayerId[];
  receiverOrder: PlayerId[];
  nextReceiver: number;
  contributedThisRound: PlayerId[];
  pot: number;
  roundsCompleted: number;
}

export interface MarketEffect {
  family: Family;
  multiplier: number;
  turnsRemaining: number;
}

export interface GameState {
  config: GameConfig;
  players: PlayerState[];
  currentPlayerIndex: number;
  turn: number;
  phase: "roll" | "actions" | "finished";
  spaces: BoardSpace[];
  ownedAssets: OwnedAsset[];
  circle: CircleState | null;
  marketEffects: MarketEffect[];
  randomState: number;
  pendingBank: boolean;
  pendingOpportunity: boolean;
  winner: PlayerId | null;
  endReason: "freedom" | "turn_limit" | null;
}

export type Action =
  | { type: "roll" }
  | { type: "buyAsset" }
  | { type: "upgradeAsset"; assetId: string }
  | { type: "sellAsset"; assetId: string }
  | { type: "takeLoan"; amount: number }
  | { type: "repayLoan"; amount: number }
  | { type: "buyInsurance"; insuranceType: InsuranceType }
  | { type: "proposeTrade"; otherPlayerId: PlayerId; offeredAssetId?: string; requestedAssetId?: string; offeredCash: number; requestedCash: number; accepted: boolean }
  | { type: "joinCircle" }
  | { type: "payAudit" }
  | { type: "waitAudit" }
  | { type: "endTurn" };

export interface GameEvent {
  type: string;
  playerId?: PlayerId;
  amount?: number;
  assetId?: string;
  cardKey?: string;
  dice?: [number, number];
}

export interface CardEffect {
  type: "cash" | "salary_bonus" | "asset_multiplier" | "base_expenses" | "asset_discount";
  amount?: number;
  family?: Family;
  multiplier?: number;
  turns?: number;
}

export interface GameCard {
  id: string;
  titleKey: string;
  textKey: string;
  effect: CardEffect;
  insuranceType?: InsuranceType;
}
