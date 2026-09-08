// Génère les icônes PWA et les splash screens iOS de l'identité "Nocturne".
// Monogramme "e" en Libre Bodoni Bold Italic sur fond aubergine, cerclé d'un
// filet laiton avec un point corail. Fond full-bleed : iOS applique lui-même
// son masque arrondi, un coin pré-arrondi donnerait un double arrondi.
//
// Le glyphe est converti en TRACÉ VECTORIEL par opentype.js — il n'y a aucun
// <text> dans le SVG. C'est délibéré : resvg ignore silencieusement la police
// passée via `fontBuffers` et retombe sur les polices système. Vérifié en
// comparant les empreintes : le rendu avec tampon de police est bit à bit
// identique au rendu avec les polices système. Un logotype en <text>
// dépendrait donc des polices de la machine de build. En tracé, c'est
// déterministe.
//
// Usage ponctuel : `node scripts/generate-icons.mjs`
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decompress } from "wawoff2";
import { Resvg } from "@resvg/resvg-js";
import opentype from "opentype.js";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const INK = "#1A1016";
const IVORY = "#F4EAE6";
const BRASS = "#D4A64A";
const CORAL = "#F0937B";

const FONT = join(
  root,
  "node_modules/@fontsource/libre-bodoni/files/libre-bodoni-latin-700-italic.woff2"
);

/** Extrait le "e" en tracé, avec sa boîte englobante réelle — c'est elle qui
 *  permet de centrer optiquement, pas les métriques de la police. */
async function loadGlyph() {
  const ttf = Buffer.from(await decompress(readFileSync(FONT)));
  const font = opentype.parse(
    ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.length)
  );
  const path = font.charToGlyph("e").getPath(0, 0, 1000);
  return { d: path.toPathData(2), box: path.getBoundingBox() };
}

/** Met le tracé à la hauteur voulue et le centre sur (cx, cy). */
function place({ box }, targetHeight, cx, cy) {
  const w = box.x2 - box.x1;
  const h = box.y2 - box.y1;
  const scale = targetHeight / h;
  const tx = cx - (box.x1 + w / 2) * scale;
  const ty = cy - (box.y1 + h / 2) * scale;
  return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(5)})`;
}

function iconSvg(glyph, size) {
  const c = size / 2;
  const ringR = size * 0.365; // reste dans la zone sûre maskable (66 %)
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${INK}"/>
  <circle cx="${c}" cy="${c}" r="${ringR}" fill="none" stroke="${BRASS}" stroke-width="${Math.max(1, size * 0.004)}"/>
  <circle cx="${c}" cy="${c - ringR}" r="${size * 0.012}" fill="${CORAL}"/>
  <path d="${glyph.d}" fill="${IVORY}" transform="${place(glyph, size * 0.4, c, c)}"/>
</svg>`.trim();
}

function splashSvg(glyph, w, h) {
  const unit = Math.min(w, h) * 0.32;
  const cx = w / 2;
  const cy = h / 2;
  const ringR = unit * 0.62;
  return `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${BRASS}" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy - ringR}" r="${unit * 0.02}" fill="${CORAL}"/>
  <path d="${glyph.d}" fill="${IVORY}" transform="${place(glyph, unit * 0.68, cx, cy)}"/>
</svg>`.trim();
}

const render = (svg, width) =>
  new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();

async function main() {
  const glyph = await loadGlyph();
  mkdirSync(join(root, "public/icons"), { recursive: true });
  mkdirSync(join(root, "public/splash"), { recursive: true });

  for (const size of [16, 32, 180, 192, 512]) {
    const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
    writeFileSync(join(root, "public/icons", name), render(iconSvg(glyph, size), size));
    console.log("écrit", name);
  }

  writeFileSync(
    join(root, "public/icons/icon-512-maskable.png"),
    render(iconSvg(glyph, 512), 512)
  );
  console.log("écrit icon-512-maskable.png");

  writeFileSync(
    join(root, "public/favicon.ico"),
    await sharp(join(root, "public/icons/icon-32.png")).toBuffer()
  );

  const splashes = [
    { w: 1170, h: 2532, name: "iphone-12-13-14.png" },
    { w: 1179, h: 2556, name: "iphone-15-16.png" },
    { w: 1290, h: 2796, name: "iphone-pro-max.png" },
    { w: 1080, h: 2340, name: "iphone-se-plus.png" },
    { w: 750, h: 1334, name: "iphone-se.png" },
  ];
  for (const { w, h, name } of splashes) {
    writeFileSync(join(root, "public/splash", name), render(splashSvg(glyph, w, h), w));
    console.log("écrit splash/" + name);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
