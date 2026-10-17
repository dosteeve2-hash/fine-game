import fs from "node:fs";
import { execSync } from "node:child_process";
const p = JSON.parse(process.argv[2]);
const orig = JSON.parse(fs.readFileSync("scripts/board.orig.json", "utf8"));
const board = orig.map(s => s.type === "asset" ? { ...s, baseIncome: Math.round(s.baseIncome * p.scale), rent: Math.max(1, Math.round(s.rent * p.scale)) } : s);
fs.writeFileSync("src/data/board.json", JSON.stringify(board, null, 2));
const cfg = JSON.parse(fs.readFileSync("src/data/config.json", "utf8"));
for (const m of Object.keys(cfg)) Object.assign(cfg[m], p.all ?? {}, p[m] ?? {});
fs.writeFileSync("src/data/config.json", JSON.stringify(cfg, null, 2));
const out = execSync("npx tsx scripts/simulate.ts", { env: { ...process.env, SIM_GAMES: String(p.games ?? 120) }, maxBuffer: 1e8 }).toString();
const r = JSON.parse(out);
for (const m of Object.keys(r)) {
  const x = r[m];
  console.log(m, "fin%", x.finishRateBeforeMaxPercent, "tours", x.averageTurns, "tours/joueur", (x.averageTurns / 4).toFixed(1), "sièges%", x.winShareBySeatPercent.join("/"), "niveaux%", x.winRateByLevelPercent[1], x.winRateByLevelPercent[2], x.winRateByLevelPercent[3]);
}
