// Génère les visages de Fina avec DiceBear Lorelei (dessin de Lisa Wischofsky, CC0 1.0 ; code MIT), en local.
import fs from "node:fs";
import path from "node:path";
import { createAvatar } from "@dicebear/core";
import * as lorelei from "@dicebear/lorelei";

const base = {
  seed: "Fina",
  skinColor: ["a0673f"],
  hairColor: ["1f1a17"],
  hair: ["variant38"],
  head: ["variant04"],
  nose: ["variant03"],
  glassesProbability: 100,
  glasses: ["variant03"],
  glassesColor: ["2a1d12"],
  earringsProbability: 100,
  earrings: ["variant01"],
  earringsColor: ["f0a832"],
  beardProbability: 0,
  frecklesProbability: 0,
  hairAccessoriesProbability: 0
};

const moods = {
  idle: { eyes: ["variant04"], eyebrows: ["variant02"], mouth: ["happy01"] },
  blink: { eyes: ["variant19"], eyebrows: ["variant02"], mouth: ["happy01"] },
  happy: { eyes: ["variant01"], eyebrows: ["variant02"], mouth: ["happy03"] },
  thinking: { eyes: ["variant07"], eyebrows: ["variant12"], mouth: ["happy14"] },
  surprised: { eyes: ["variant21"], eyebrows: ["variant01"], mouth: ["sad01"] },
  worried: { eyes: ["variant13"], eyebrows: ["variant04"], mouth: ["sad04"] },
  celebrate: { eyes: ["variant01"], eyebrows: ["variant01"], mouth: ["happy05"] }
};

const strip = svg => svg
  .replace(/<metadata[\s\S]*?<\/metadata>/g, "")
  .replace(/\s+xmlns:\w+="[^"]*"/g, "")
  .replace(/<mask id="viewboxMask">[\s\S]*?<\/mask>/, "")
  .replace(' mask="url(#viewboxMask)"', "")
  .replace(/^<svg /, '<svg width="100%" height="100%" aria-hidden="true" focusable="false" ');
const lines = [
  "// Généré par scripts/make-fina.mjs (DiceBear Lorelei, CC0 1.0). Ne pas modifier à la main.",
  "export const finaFaces = {"
];
for (const [mood, options] of Object.entries(moods)) {
  const svg = strip(createAvatar(lorelei, { ...base, ...options }).toString());
  lines.push(`  ${mood}: ${JSON.stringify(svg)},`);
}
lines.push("} as const;", "", "export type FinaFace = keyof typeof finaFaces;", "");
const root = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1");
const out = path.join(root, "..", "src", "ui", "art", "fina.generated.ts");
fs.writeFileSync(out, lines.join("\n"));
process.stdout.write(`écrit : ${out} (${fs.statSync(out).size} octets)\n`);
