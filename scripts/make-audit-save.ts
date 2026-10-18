// Fabrique une sauvegarde de test où le premier lancer du joueur humain tombe sur le Contrôle fiscal.
// Usage : npx tsx scripts/make-audit-save.ts <joueurs 2|4> > save.json, puis localStorage["fine.save.v1"] = contenu.
import configs from "../src/data/config.json";
import { applyAction, createGame } from "../src/engine";
import type { GameConfig, GameState } from "../src/engine/types";

const count = Number(process.argv[2] ?? 2) as 2 | 4;
const config = configs.quick as GameConfig;
const base = createGame({ ...config, playerCount: count, playerTypes: ["human", ...Array.from({ length: count - 1 }, () => "bot" as const)], botLevels: Array.from({ length: count }, () => 2 as const) }, 4242);
const auditSpace = base.spaces.findIndex(space => space.type === "audit");
let found: GameState | null = null;
for (let seed = 0; seed < 5000 && !found; seed += 1) {
  const candidate: GameState = { ...base, randomState: seed, players: base.players.map((player, index) => index === 0 ? { ...player, position: auditSpace - 7 } : player) };
  const landed = applyAction(candidate, { type: "roll" }).events.find(event => event.type === "space.landed");
  if (landed?.amount === auditSpace) found = candidate;
}
if (!found) throw new Error("no seed found");
const names = ["Awa", "Robot 2", "Robot 3", "Robot 4"].slice(0, count);
const pawns = ["camel-head", "steam-locomotive", "sailboat", "rocket"].slice(0, count);
process.stdout.write(JSON.stringify({ state: found, names, pawns, log: [], nextId: 1, ledger: [], statements: [] }));
