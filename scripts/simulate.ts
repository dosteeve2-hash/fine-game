import configs from "../src/data/config.json";
import { applyAction, chooseBotAction, createGame } from "../src/engine";
import type { GameConfig, GameState } from "../src/engine/types";

interface ModeStatistics {
  games: number;
  finishedEarly: number;
  turnsTotal: number;
  winsBySeat: number[];
  winsByLevel: Record<1 | 2 | 3, number>;
  entrantsByLevel: Record<1 | 2 | 3, number>;
  winsByReason: Record<string, number>;
  finishRateBeforeMaxPercent: number;
  averageTurns: number;
  winShareBySeatPercent: number[];
  winRateByLevelPercent: Record<1 | 2 | 3, number>;
  criteriaMet: {
    earlyFinishAtLeast99Percent: boolean;
    noSeatAbove40Percent: boolean;
    level3BeatsLevel1ByFivePoints: boolean;
  };
}

function simulateGame(config: GameConfig, seed: number, levels: Array<1 | 2 | 3>): GameState {
  let state = createGame({ ...config, playerCount: 4, botLevels: levels }, seed);
  state = { ...state, players: state.players.map(player => ({ ...player, isBot: true })) };
  const maximumActions = config.maxTurns * state.players.length * 3 + 10;
  for (let step = 0; step < maximumActions && state.phase !== "finished"; step += 1) {
    const player = state.players[state.currentPlayerIndex];
    if (!player) throw new Error("The current player is missing");
    const action = chooseBotAction(state, player.botLevel);
    state = applyAction(state, action).state;
  }
  if (state.phase !== "finished") throw new Error("A simulated game exceeded its action limit");
  return state;
}

const modes = Object.entries(configs) as Array<[GameConfig["mode"], GameConfig]>;
const results: Record<string, ModeStatistics> = {};

for (const [modeIndex, [mode, config]] of modes.entries()) {
  const stats: Omit<ModeStatistics, "finishRateBeforeMaxPercent" | "averageTurns" | "winShareBySeatPercent" | "winRateByLevelPercent" | "criteriaMet"> = {
    games: Number(process.env.SIM_GAMES ?? 1000),
    finishedEarly: 0,
    turnsTotal: 0,
    winsBySeat: [0, 0, 0, 0],
    winsByLevel: { 1: 0, 2: 0, 3: 0 },
    entrantsByLevel: { 1: 0, 2: 0, 3: 0 },
    winsByReason: {}
  };
  for (let game = 0; game < stats.games; game += 1) {
    const base: Array<1 | 2 | 3> = [1, 2, 3, 3];
    const rotation = game % base.length;
    const levels = [...base.slice(rotation), ...base.slice(0, rotation)];
    for (const level of levels) stats.entrantsByLevel[level] += 1;
    const seed = modeIndex * 1_000_000 + game + 1;
    const state = simulateGame(config, seed, levels);
    stats.turnsTotal += state.turn;
    if (state.endReason === "freedom") stats.finishedEarly += 1;
    const reason = state.endReason ?? "unknown";
    stats.winsByReason[reason] = (stats.winsByReason[reason] ?? 0) + 1;
    const winner = state.players.find(player => player.id === state.winner);
    if (winner) {
      const seat = Number(winner.id.replace("player-", "")) - 1;
      stats.winsBySeat[seat] = (stats.winsBySeat[seat] ?? 0) + 1;
      stats.winsByLevel[winner.botLevel] += 1;
    }
  }
  const finishRate = Number((stats.finishedEarly / stats.games * 100).toFixed(2));
  const winShareBySeat = stats.winsBySeat.map(wins => Number((wins / stats.games * 100).toFixed(2)));
  const winRateByLevel = {
    1: Number((stats.winsByLevel[1] / stats.entrantsByLevel[1] * 100).toFixed(2)),
    2: Number((stats.winsByLevel[2] / stats.entrantsByLevel[2] * 100).toFixed(2)),
    3: Number((stats.winsByLevel[3] / stats.entrantsByLevel[3] * 100).toFixed(2))
  };
  results[mode] = {
    ...stats,
    finishRateBeforeMaxPercent: finishRate,
    averageTurns: Number((stats.turnsTotal / stats.games).toFixed(2)),
    winShareBySeatPercent: winShareBySeat,
    winRateByLevelPercent: winRateByLevel,
    criteriaMet: {
      earlyFinishAtLeast99Percent: finishRate >= 99,
      noSeatAbove40Percent: winShareBySeat.every(share => share <= 40),
      level3BeatsLevel1ByFivePoints: winRateByLevel[3] >= winRateByLevel[1] + 5
    }
  };
}

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
