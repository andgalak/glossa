// Generates the Glōssa app icons (PNG) from an inline SVG.
// Run with sharp available: `npm i sharp --no-save && node scripts/gen-icons.mjs`
// Output: public/apple-touch-icon.png (180), public/icon-192.png, public/icon-512.png
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public");

// Brand palette (from tokens.js / CLAUDE.md)
const GREEN = "#2B5F47";
const GREEN_TOP = "#367055";
const CREAM = "#F5F0E8";
const AMBER = "#B87B2A";

// 512x512 master. The Γ is drawn as overlapping cream rectangles (one fill,
// no seams) so it renders identically everywhere without a webfont. Glyph and
// accent sit well within the central 80% safe zone for maskable cropping.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GREEN_TOP}"/>
      <stop offset="1" stop-color="${GREEN}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g fill="${CREAM}">
    <!-- top arm -->
    <rect x="168" y="150" width="192" height="56"/>
    <!-- left stem -->
    <rect x="168" y="150" width="56" height="222"/>
    <!-- serif: widened top -->
    <rect x="150" y="150" width="92" height="20"/>
    <!-- serif: widened foot -->
    <rect x="150" y="352" width="92" height="20"/>
    <!-- serif: right-end downstroke on the arm -->
    <rect x="338" y="150" width="22" height="74"/>
  </g>
  <!-- amber accent bar (echoes the "Cards" sub-brand) -->
  <rect x="196" y="398" width="120" height="16" rx="8" fill="${AMBER}"/>
</svg>`;

const targets = [
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
];

const buf = Buffer.from(svg);
for (const { file, size } of targets) {
  await sharp(buf).resize(size, size).png().toFile(resolve(out, file));
  console.log("wrote", file, size + "x" + size);
}
