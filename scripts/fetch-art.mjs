// Copie locale des icônes retenues (Iconify) : un appel groupé par jeu, réponses mises en cache dans scripts/art-cache/.
// Relancer ce script ne refait aucun appel réseau tant que le cache contient toutes les icônes demandées.
import fs from "node:fs";
import path from "node:path";

const wanted = {
  "game-icons": [
    "top-hat", "sailboat", "ship-bow", "cargo-ship", "steam-locomotive", "old-wagon", "biplane", "rocket", "cat", "wolf-head",
    "elephant", "rooster", "horse-head", "camel-head", "wheelbarrow", "anvil", "coins", "dice-six-faces-five",
    "gavel", "park-bench", "piggy-bank", "cash", "swap-bag",
    "card-random", "stamper", "siren", "open-treasure-chest", "magnifying-glass", "laurels-trophy", "lightning-storm", "exit-door", "sun"
  ],
  noto: ["top-hat", "coin", "game-die", "money-bag", "bank", "balance-scale", "camping", "sunrise"],
  "fluent-emoji-flat": ["handshake"],
  mdi: ["account-group"]
};

const authorCandidates = ["lorc", "delapouite", "skoll", "carl-olsen", "sbed", "john-colburn", "cathelineau", "faithtoken", "felbrigg", "guard13007", "heavenly-dog", "zajkonur", "caro-asercion", "darkzaitzev", "pierre-leducq", "sparker", "willdabeast", "quoting", "viscious-speed", "lucasms", "priorblue", "starseeker", "andymeneely", "irongamer", "kier-heyl", "rihlsul", "spencerdub", "zeromancer", "aussiesim", "catsu", "generalace135", "lord-berandas", "john-redman", "wildabeast"];

const root = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1");
const cacheDir = path.join(root, "art-cache");
fs.mkdirSync(cacheDir, { recursive: true });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function loadSet(prefix, names) {
  const file = path.join(cacheDir, `${prefix}.json`);
  const cached = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  const missing = names.filter(name => !cached?.icons?.[name]);
  if (cached && missing.length === 0) return cached;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.iconify.design/${prefix}.json?icons=${names.join(",")}`);
    if (response.status === 429) {
      await wait(5000 * (attempt + 1));
      continue;
    }
    if (!response.ok) throw new Error(`${prefix}: HTTP ${response.status}`);
    const data = await response.json();
    fs.writeFileSync(file, JSON.stringify(data, null, 1));
    return data;
  }
  throw new Error(`${prefix}: rate limited`);
}

async function loadAuthors(names) {
  const file = path.join(cacheDir, "game-icons-authors.json");
  const authors = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  for (const name of names) {
    if (authors[name]) continue;
    for (const author of authorCandidates) {
      const response = await fetch(`https://game-icons.net/1x1/${author}/${name}.html`, { method: "HEAD" });
      if (response.ok) {
        authors[name] = author;
        break;
      }
      await wait(60);
    }
    if (!authors[name]) process.stdout.write(`auteur introuvable : ${name}\n`);
    fs.writeFileSync(file, JSON.stringify(authors, null, 1));
  }
  return authors;
}

const sets = {};
for (const [prefix, names] of Object.entries(wanted)) {
  sets[prefix] = await loadSet(prefix, names);
  const notFound = sets[prefix].not_found ?? [];
  if (notFound.length) process.stdout.write(`${prefix} introuvables : ${notFound.join(", ")}\n`);
}
const authors = await loadAuthors(wanted["game-icons"].filter(name => sets["game-icons"].icons[name]));

const lines = [
  "// Généré par scripts/fetch-art.mjs à partir de l'API Iconify (copie locale, aucun appel réseau à l'exécution).",
  "export interface ArtIcon {",
  "  body: string;",
  "  width: number;",
  "  height: number;",
  "}",
  "",
  "export const art = {"
];
for (const [prefix, names] of Object.entries(wanted)) {
  const data = sets[prefix];
  for (const name of names) {
    const icon = data.icons[name];
    if (!icon) continue;
    const width = icon.width ?? data.width ?? 16;
    const height = icon.height ?? data.height ?? 16;
    lines.push(`  ${JSON.stringify(`${prefix}:${name}`)}: { body: ${JSON.stringify(icon.body)}, width: ${width}, height: ${height} },`);
  }
}
lines.push("} as const satisfies Record<string, ArtIcon>;", "", "export type ArtName = keyof typeof art;", "");
lines.push("export const gameIconAuthors: Partial<Record<ArtName, string>> = {");
for (const [name, author] of Object.entries(authors).filter(([name]) => wanted["game-icons"].includes(name))) lines.push(`  ${JSON.stringify(`game-icons:${name}`)}: ${JSON.stringify(author)},`);
lines.push("};", "");
const out = path.join(root, "..", "src", "ui", "art", "icons.generated.ts");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join("\n"));
process.stdout.write(`écrit : ${out}\n`);
