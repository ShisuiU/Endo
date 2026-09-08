// Génère les icônes PWA (et les splash screens iOS) de l'identité "Atelier".
// Monogramme "e" en Fraunces 900 italic sur fond bordeaux, filet laiton, jewel rosewood.
// Usage ponctuel : `node scripts/generate-icons.mjs`
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decompress } from "wawoff2";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const INK = "#3B0F1F";
const IVORY = "#FBF6F1";
const BRASS = "#B08D57";
const ROSEWOOD = "#C98374";

async function loadFontTtf() {
  const woff2Path = join(
    root,
    "node_modules/@fontsource/fraunces/files/fraunces-latin-900-italic.woff2"
  );
  const woff2 = readFileSync(woff2Path);
  const ttf = await decompress(woff2);
  return Buffer.from(ttf);
}

function iconSvg({ size = 512 } = {}) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  // safe zone ring stays within Android's 66% maskable safe circle
  const ringR = s * 0.365;
  const glyphSize = s * 0.62;
  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${s}" height="${s}" fill="${INK}"/>
  <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${BRASS}" stroke-width="${Math.max(1, s * 0.004)}"/>
  <circle cx="${cx}" cy="${cy - ringR}" r="${s * 0.012}" fill="${ROSEWOOD}"/>
  <text
    x="${cx}"
    y="${cy}"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Fraunces"
    font-weight="900"
    font-style="italic"
    font-size="${glyphSize}"
    fill="${IVORY}"
  >e</text>
</svg>`.trim();
}

function splashSvg({ w, h }) {
  const iconSize = Math.min(w, h) * 0.32;
  const cx = w / 2;
  const cy = h / 2;
  return `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${IVORY}"/>
  <circle cx="${cx}" cy="${cy}" r="${iconSize * 0.62}" fill="none" stroke="${BRASS}" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy - iconSize * 0.62}" r="${iconSize * 0.02}" fill="${ROSEWOOD}"/>
  <text
    x="${cx}"
    y="${cy}"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Fraunces"
    font-weight="900"
    font-style="italic"
    font-size="${iconSize}"
    fill="${INK}"
  >e</text>
</svg>`.trim();
}

async function renderPng(svg, size, fontBuffer) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    font: {
      fontBuffers: [fontBuffer],
      loadSystemFonts: false,
      defaultFontFamily: "Fraunces",
    },
    background: "rgba(0,0,0,0)",
  });
  const rendered = resvg.render();
  return rendered.asPng();
}

async function main() {
  const font = await loadFontTtf();
  mkdirSync(join(root, "public/icons"), { recursive: true });
  mkdirSync(join(root, "public/splash"), { recursive: true });

  const sizes = [16, 32, 180, 192, 512];
  for (const size of sizes) {
    const png = await renderPng(iconSvg({ size }), size, font);
    const name =
      size === 180
        ? "apple-touch-icon.png"
        : size === 16 || size === 32
          ? `icon-${size}.png`
          : `icon-${size}.png`;
    writeFileSync(join(root, "public/icons", name), png);
    console.log("wrote", name);
  }

  // Maskable 512 — same composition, already within the 66% safe circle.
  const maskablePng = await renderPng(iconSvg({ size: 512 }), 512, font);
  writeFileSync(join(root, "public/icons/icon-512-maskable.png"), maskablePng);
  console.log("wrote icon-512-maskable.png");

  // Favicon.ico from the 32px png
  const favicon32 = await sharp(join(root, "public/icons/icon-32.png")).toBuffer();
  writeFileSync(join(root, "public/favicon.ico"), favicon32);

  // A representative set of iOS splash screens (portrait) — covers the most common
  // recent iPhone viewport sizes at device pixel ratio 3/2.
  const splashSizes = [
    { w: 1170, h: 2532, name: "iphone-12-13-14.png" }, // 6.1"
    { w: 1179, h: 2556, name: "iphone-15-16.png" }, // 6.1" 2023+
    { w: 1290, h: 2796, name: "iphone-pro-max.png" }, // 6.7"
    { w: 1080, h: 2340, name: "iphone-se-plus.png" },
    { w: 750, h: 1334, name: "iphone-se.png" }, // 4.7"
  ];
  for (const { w, h, name } of splashSizes) {
    const svg = splashSvg({ w, h });
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: w },
      font: { fontBuffers: [font], loadSystemFonts: false, defaultFontFamily: "Fraunces" },
      background: "#FBF6F1",
    });
    const png = resvg.render().asPng();
    writeFileSync(join(root, "public/splash", name), png);
    console.log("wrote splash/" + name);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
