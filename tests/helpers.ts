import configs from "../src/data/config.json";
import board from "../src/data/board.json";
import type { GameConfig, GameState, OwnedAsset } from "../src/engine/types";
import { createGame } from "../src/engine";
import { applyAction } from "../src/engine";

export const config = configs.standard as GameConfig;

export function stateAt(position: number, seed = 42): GameState {
  const state = createGame(config, seed);
  return {
    ...state,
    phase: "actions",
    players: state.players.map((player, index) => index === 0 ? { ...player, position } : player)
  };
}

export function addOwnedAsset(state: GameState, playerIndex: number, spaceIndex: number, level: 1 | 2 | 3 = 1): GameState {
  const space = board[spaceIndex];
  if (!space?.assetId) throw new Error("Fixture space is not an asset");
  const player = state.players[playerIndex];
  if (!player) throw new Error("Fixture player does not exist");
  const owned: OwnedAsset = { assetId: space.assetId, ownerId: player.id, level };
  return {
    ...state,
    players: state.players.map((item, index) => index === playerIndex ? { ...item, assets: [...item.assets, owned] } : item),
    ownedAssets: [...state.ownedAssets, owned]
  };
}

export function completeTurn(state: GameState): GameState {
  const afterRoll = state.phase === "roll" ? applyAction(state, { type: "roll" }).state : state;
  return applyAction(afterRoll, { type: "endTurn" }).state;
}
