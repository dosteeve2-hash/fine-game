import configs from "../src/data/config.json";
import { applyAction, chooseBotAction, createGame } from "../src/engine";
import type { GameConfig } from "../src/engine/types";
const config = configs.standard as GameConfig;
const sums: Record<number, { n: number; assets: number; cash: number; loans: number; lv: number; reps: number }> = {};
for (let g = 0; g < 30; g++) {
  const levels: Array<1 | 2 | 3> = [1, 2, 3, 3];
  let s = createGame({ ...config, playerCount: 4, botLevels: levels }, g + 1);
  s = { ...s, players: s.players.map(p => ({ ...p, isBot: true })) };
  for (let i = 0; i < 5000 && s.phase !== "finished"; i++) {
    const p = s.players[s.currentPlayerIndex]!;
    s = applyAction(s, chooseBotAction(s, p.botLevel)).state;
  }
  for (const p of s.players) {
    const a = (sums[p.botLevel] ??= { n: 0, assets: 0, cash: 0, loans: 0, lv: 0, reps: 0 });
    a.n++; a.assets += p.assets.length; a.cash += p.cash; a.loans += p.loans.reduce((x, l) => x + l.principal, 0);
    a.lv += p.assets.reduce((x, o) => x + o.level, 0); a.reps += p.reputation;
  }
}
for (const [k, a] of Object.entries(sums)) console.log("niveau", k, "actifs", (a.assets / a.n).toFixed(1), "niveaux cumulés", (a.lv / a.n).toFixed(1), "cash", Math.round(a.cash / a.n), "dettes", Math.round(a.loans / a.n), "réput.", (a.reps / a.n).toFixed(1));
