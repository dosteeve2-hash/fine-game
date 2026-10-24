// Rasterises the "Sceau" logo into every installable-app image (icons, maskable icons, apple-touch-icon, favicon, iOS start screens).
// Run: PW_DIR=<folder containing node_modules/playwright> node scripts/make-app-images.mjs   (Chrome must be installed for Playwright)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const require = createRequire(path.join(process.env.PW_DIR ?? root, "noop.js"));
const { chromium } = require("playwright");

const BG = "#070e1f";
const seal = pathToFileURL(path.join(pub, "logos", "fine-sceau-rond.svg")).href;
const iconSvg = fs.readFileSync(path.join(pub, "logos", "fine-5-sceau-icone-512.svg"), "utf8");
fs.writeFileSync(path.join(pub, "icon.svg"), iconSvg);

const screens = [
  [1320, 2868, 440, 956, 3], [1206, 2622, 402, 874, 3], [1290, 2796, 430, 932, 3], [1179, 2556, 393, 852, 3], [1284, 2778, 428, 926, 3],
  [1170, 2532, 390, 844, 3], [1125, 2436, 375, 812, 3], [1242, 2688, 414, 896, 3], [828, 1792, 414, 896, 2], [750, 1334, 375, 667, 2]
];

const browser = await chromium.launch();
const page = await browser.newPage();
const sealFile = pathToFileURL(path.join(root, "node_modules", ".sceau-wrap.html")).href;

async function shot(width, height, sealHeight, offsetY, out, glow = false) {
  const html = `<body style="margin:0;width:${width}px;height:${height}px;background:${BG};position:relative;overflow:hidden">
    ${glow ? `<div style="position:absolute;inset:0;background:radial-gradient(60% 40% at 50% ${offsetY * 100}%, rgba(240,168,50,.14), transparent 70%)"></div>` : ""}
    <img src="${seal}" style="position:absolute;left:50%;top:${offsetY * 100}%;height:${sealHeight}px;transform:translate(-50%,-50%)"></body>`;
  const file = path.join(root, "node_modules", ".sceau-wrap.html");
  fs.writeFileSync(file, html);
  await page.setViewportSize({ width, height });
  await page.goto(sealFile + "?" + Date.now());
  await page.waitForFunction(() => Array.from(document.images).every(i => i.complete && i.naturalWidth > 0));
  await page.screenshot({ path: out });
}

await shot(192, 192, 192 * 0.8, 0.5, path.join(pub, "icon-192.png"));
await shot(512, 512, 512 * 0.8, 0.5, path.join(pub, "icon-512.png"));
await shot(180, 180, 180 * 0.84, 0.5, path.join(pub, "apple-touch-icon.png"));
await shot(192, 192, 192 * 0.62, 0.5, path.join(pub, "icon-maskable-192.png"));
await shot(512, 512, 512 * 0.62, 0.5, path.join(pub, "icon-maskable-512.png"));
await shot(32, 32, 32, 0.5, path.join(pub, "favicon-32.png"));
await shot(48, 48, 48, 0.5, path.join(pub, "favicon-48.png"));

fs.mkdirSync(path.join(pub, "splash"), { recursive: true });
const entries = [];
for (const [width, height, cssW, cssH, ratio] of screens) {
  const name = `splash-${width}x${height}.png`;
  await shot(width, height, Math.min(width, height) * 0.42, 0.44, path.join(pub, "splash", name), true);
  entries.push({
    url: `/splash/${name}`,
    media: `(device-width: ${cssW}px) and (device-height: ${cssH}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`
  });
}
fs.writeFileSync(path.join(root, "src", "app", "startup-images.json"), JSON.stringify(entries, null, 2) + "\n");
await browser.close();
