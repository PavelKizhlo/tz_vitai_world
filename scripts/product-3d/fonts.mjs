// Шрифты сайта в TTF для перевода текста этикеток в кривые.
// Качаются с Google Fonts один раз и кешируются в node_modules/.cache
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import opentype from "opentype.js";

const CACHE_DIR = "node_modules/.cache/product-3d-fonts";

const FONTS = {
  display: ["Unbounded", 700],
  displayMed: ["Unbounded", 500],
  text: ["Onest", 400],
  textSemi: ["Onest", 600],
  hand: ["Caveat", 500],
};

// Со старым User-Agent Google Fonts отдаёт полный TTF (с кириллицей) вместо woff2-подмножеств
const LEGACY_UA = "Mozilla/4.0";

async function download(family, weight, file) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`, {
    headers: { "User-Agent": LEGACY_UA },
  }).then((r) => r.text());
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`Не нашёл TTF для ${family} ${weight}`);
  const ttf = Buffer.from(await fetch(url).then((r) => r.arrayBuffer()));
  writeFileSync(file, ttf);
}

export async function loadFonts() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const fonts = {};
  for (const [key, [family, weight]] of Object.entries(FONTS)) {
    const file = `${CACHE_DIR}/${family}-${weight}.ttf`;
    if (!existsSync(file)) await download(family, weight, file);
    const b = readFileSync(file);
    fonts[key] = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
  }
  return fonts;
}
