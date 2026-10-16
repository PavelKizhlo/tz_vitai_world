// Этикетки для пачек и коробки дрипов: SVG в координатах граней модели → WebP-атлас
import sharp from "sharp";

const SIZE = 2048;

// Токены из src/app/globals.css
const C = {
  surface100: "#fbf5ec",
  surface300: "#ebddc8",
  ink: "#2e2620",
  inkMuted: "#6b5a4c",
  coral: "#ee6a4f",
  coralSoft: "#fad3c6",
  terracotta: "#b5442a",
  sage: "#5c7048",
  denim: "#3f4e80",
  ochre: "#e3a53c",
  dustyBlue: "#a9bfc4",
  logoBean: "#fde6de",
  logoQuarter: "#fbefd6",
  logoLens: "#dfe6d4",
};

/** Шрифты из fonts.mjs и рамки граней из models.mjs — задаются в renderLabels */
let F;
let frames;

/* ---------- Текст в кривые ---------- */

function measure(font, str, size, tracking = 0) {
  const glyphs = font.stringToGlyphs(str);
  const k = size / font.unitsPerEm;
  let w = 0;
  glyphs.forEach((g, i) => {
    w += g.advanceWidth * k;
    if (i < glyphs.length - 1) w += font.getKerningValue(g, glyphs[i + 1]) * k + tracking * size;
  });
  return w;
}

// toPathData из opentype.js 2.0 выдаёт NaN для координат около нуля — собираем d сами
const num = (v) => (Math.abs(v) < 5e-5 ? "0" : v.toFixed(4));
function pathData(path) {
  return path.commands
    .map((c) => {
      if (c.type === "M" || c.type === "L") return `${c.type}${num(c.x)} ${num(c.y)}`;
      if (c.type === "Q") return `Q${num(c.x1)} ${num(c.y1)} ${num(c.x)} ${num(c.y)}`;
      if (c.type === "C")
        return `C${num(c.x1)} ${num(c.y1)} ${num(c.x2)} ${num(c.y2)} ${num(c.x)} ${num(c.y)}`;
      return "Z";
    })
    .join("");
}

/** anchor: start | middle | end; tracking в em; maxWidth уменьшает кегль, если строка не влезает */
function text(
  str,
  { font, size, x = 0, y = 0, anchor = "start", fill = C.ink, tracking = 0, maxWidth, rotate = 0 },
) {
  let s = size;
  if (maxWidth) s = Math.min(s, (size * maxWidth) / measure(font, str, size, tracking));
  const w = measure(font, str, s, tracking);
  let cx = anchor === "middle" ? -w / 2 : anchor === "end" ? -w : 0;
  const glyphs = font.stringToGlyphs(str);
  const k = s / font.unitsPerEm;
  // Каждый глиф — отдельный path, чтобы контуры соседних букв не влияли на заливку друг друга
  let paths = "";
  glyphs.forEach((g, i) => {
    const d = pathData(g.getPath(cx, 0, s));
    if (d) paths += `<path d="${d}"/>`;
    cx += g.advanceWidth * k;
    if (i < glyphs.length - 1) cx += font.getKerningValue(g, glyphs[i + 1]) * k + tracking * s;
  });
  return `<g transform="translate(${x} ${y}) rotate(${rotate})" fill="${fill}">${paths}</g>`;
}

/* ---------- Логотип (копия геометрии из src/components/ui/Logo.tsx) ---------- */

const LETTERS = [
  "M8 0V140M14.4 72L100 0M14.4 68L100 140",
  "M8 0V140M8 8H53A31 31 0 0 1 53 70H8M53 70H61A31 31 0 0 1 61 132H8",
  "M8 140V50A42 42 0 0 1 92 50V140M8 94H92",
  "M8 140V0M8 8H54A38 38 0 0 1 54 84H8",
  "M0 8H100M50 8V140",
  "M8 140V50A42 42 0 0 1 92 50V140M8 94H92",
];
const CLIP = `<clipPath id="lc"><rect width="100" height="140"/></clipPath>`;

/** Знак 2×2 плитки, левый верхний угол в (x, y), сторона size */
function mark(x, y, size) {
  return `<g transform="translate(${x} ${y}) scale(${size / 160})">
    <rect width="80" height="80" fill="${C.coral}"/>
    <g transform="rotate(35 40 40)">
      <ellipse cx="40" cy="40" rx="24" ry="35" fill="${C.logoBean}"/>
      <path d="M40 7C29 27 51 53 40 73" fill="none" stroke="${C.coral}" stroke-width="5" stroke-linecap="round"/>
    </g>
    <rect x="80" width="80" height="80" fill="${C.ochre}"/>
    <path d="M160 0V80A80 80 0 0 1 80 0Z" fill="${C.logoQuarter}"/>
    <rect y="80" width="80" height="80" fill="${C.denim}"/>
    <g transform="translate(15 85) scale(0.5)"><g clip-path="url(#lc)">
      <path d="${LETTERS[0]}" fill="none" stroke="${C.surface100}" stroke-width="22"/>
    </g></g>
    <rect x="80" y="80" width="80" height="80" fill="${C.sage}"/>
    <path d="M85 155A76 76 0 0 1 155 85A76 76 0 0 1 85 155Z" fill="${C.logoLens}"/>
    <path d="M95 145C114 137 126 103 145 95" fill="none" stroke="${C.sage}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

/** Вордмарк «КВАРТА»: центр по x, верх в y, высота букв height */
function wordmark(cx, y, height, color, rotate = 0) {
  const letters = LETTERS.map(
    (d, i) => `<g transform="translate(${i * 97.6} 0) scale(0.8)"><g clip-path="url(#lc)">
      <path d="${d}" fill="none" stroke="${color}" stroke-width="16"/></g></g>`,
  ).join("");
  return `<g transform="translate(${cx} ${y}) rotate(${rotate}) scale(${height / 112}) translate(-284 0)">${letters}</g>`;
}

const half = (cx, cy, r, fill) =>
  `<path d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z" fill="${fill}"/>`;
const quarter = (x, y, r, fill) =>
  `<path d="M${x} ${y}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + r}Z" fill="${fill}"/>`;
const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
const rect = (x, y, w, h, fill, r = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;

/* ---------- Грани ---------- */

/**
 * draw(w, h) рисует грань в её координатах: x вправо, y вниз от верхнего левого угла,
 * в единицах модели. Грань растеризуется плоско (в 2× от плотности атласа),
 * а в атлас кладётся картинкой с аффинной матрицей — так текст не рендерится под перекосом.
 */
async function face(model, name, draw) {
  const { bounds, matrix } = frames[model][name];
  const [s0, t0, s1, t1] = bounds;
  const [a, b, c, d, e, g] = matrix;
  const w = s1 - s0;
  const h = t1 - t0;
  const px = 2 * SIZE * Math.max(Math.hypot(a, b), Math.hypot(c, d));
  const flat = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(w * px)}" height="${Math.ceil(h * px)}" viewBox="0 0 ${w} ${h}"><defs>${CLIP}</defs>${draw(w, h)}</svg>`;
  const png = await sharp(Buffer.from(flat)).png().toBuffer();
  return `<g transform="scale(${SIZE}) matrix(${a} ${b} ${c} ${d} ${e} ${g}) translate(${s0} ${t0})">
    <image width="${w}" height="${h}" preserveAspectRatio="none" href="data:image/png;base64,${png.toString("base64")}"/></g>`;
}

async function render(file, layers, bg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>${(await Promise.all(layers)).join("")}</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(file);
}

/* ---------- Пачки (размеры в сантиметрах модели) ---------- */

const BAGS = {
  ethiopia: {
    name: "Эфиопия",
    origin: "Иргачеффе",
    notes: "цветочный, бергамот",
    badge: "светлая обжарка",
    body: C.sage,
    art: (cx, top, w) =>
      rect(cx - w / 2, top, w, 3.6, C.dustyBlue, 0.12) +
      circle(cx + 1.4, top + 1.5, 1.05, C.ochre) +
      `<g clip-path="url(#art)">${half(cx - 1.2, top + 3.6, 2.2, C.surface100)}${half(cx + 2.6, top + 3.6, 1.3, C.sage)}</g>`,
  },
  colombia: {
    name: "Колумбия",
    origin: "Уила",
    notes: "карамель, красное яблоко",
    body: C.coral,
    art: (cx, top, w) =>
      rect(cx - w / 2, top, w, 3.6, C.coralSoft, 0.12) +
      circle(cx - 2.1, top + 1.3, 0.75, C.terracotta) +
      `<g clip-path="url(#art)">${half(cx + 0.6, top + 3.6, 2.5, C.coral)}${half(cx - 3.2, top + 3.6, 1.1, C.ochre)}</g>`,
  },
  brazil: {
    name: "Бразилия",
    origin: "Серрадо",
    notes: "орех, шоколад",
    badge: "под эспрессо",
    body: C.denim,
    art: (cx, top, w) =>
      rect(cx - w / 2, top, w, 3.6, C.surface300, 0.12) +
      `<g clip-path="url(#art)">${quarter(cx - w / 2, top, 3, C.denim)}</g>` +
      circle(cx + 2.1, top + 2.2, 0.85, C.coral) +
      circle(cx + 0.4, top + 1.1, 0.35, C.ochre),
  },
};

function bagFront(p) {
  return (w) => {
    const cx = w / 2;
    // Верх пачки (клапан и сгиб) ~5 см оставляем без надписей
    const panelX = 1.6;
    const panelW = w - 3.2;
    const panelTop = 7.2;
    const panelH = 13.4;
    const artTop = panelTop + 0.7;
    const artW = panelW - 1.4;
    const bottom = panelTop + panelH;
    return [
      wordmark(cx, 5.0, 1.0, C.surface100),
      `<clipPath id="art"><rect x="${cx - artW / 2}" y="${artTop}" width="${artW}" height="3.6" rx="0.12"/></clipPath>`,
      rect(panelX, panelTop, panelW, panelH, C.surface100, 0.15),
      p.art(cx, artTop, artW),
      text(p.name.toUpperCase(), {
        font: F.display,
        size: 1.35,
        x: cx,
        y: panelTop + 6.4,
        anchor: "middle",
        maxWidth: artW,
      }),
      text(p.origin.toUpperCase(), {
        font: F.textSemi,
        size: 0.62,
        x: cx,
        y: panelTop + 7.6,
        anchor: "middle",
        tracking: 0.18,
        fill: C.inkMuted,
      }),
      rect(panelX + 0.7, panelTop + 8.35, artW, 0.04, C.ink),
      text(p.notes, {
        font: F.text,
        size: 0.62,
        x: cx,
        y: panelTop + 9.45,
        anchor: "middle",
        maxWidth: artW,
      }),
      p.badge
        ? text(p.badge.toUpperCase(), {
            font: F.textSemi,
            size: 0.42,
            x: cx,
            y: panelTop + 10.4,
            anchor: "middle",
            tracking: 0.14,
            fill: C.inkMuted,
          })
        : "",
      text("250 г", { font: F.displayMed, size: 0.62, x: panelX + 0.7, y: bottom - 0.75 }),
      text("зерно", {
        font: F.text,
        size: 0.48,
        x: panelX + 1.0 + measure(F.displayMed, "250 г", 0.62),
        y: bottom - 0.75,
        fill: C.inkMuted,
      }),
      text("обжарено в четверг", {
        font: F.hand,
        size: 0.9,
        x: panelX + panelW - 0.6,
        y: bottom - 0.7,
        anchor: "end",
        fill: C.terracotta,
        rotate: -4,
      }),
      text("свежая партия", {
        font: F.hand,
        size: 1.0,
        x: cx,
        y: bottom + 1.25,
        anchor: "middle",
        fill: C.surface100,
      }),
    ].join("");
  };
}

function bagBack(p) {
  return (w) => {
    const x = 2.0;
    const pw = w - 4.0;
    const top = 7.6;
    const inner = pw - 1.4;
    const lines = [
      ["Мастерская обжарки в Минске.", F.textSemi],
      ["Жарим партиями по 5 кг", F.text],
      ["каждый четверг, в пятницу", F.text],
      ["развозим по городу.", F.text],
    ];
    return [
      mark(w / 2 - 1.3, 3.0, 2.6),
      rect(x, top, pw, 10.0, C.surface100, 0.15),
      text(`${p.name} · ${p.origin}`.toUpperCase(), {
        font: F.display,
        size: 0.62,
        x: x + 0.7,
        y: top + 1.4,
        maxWidth: inner,
      }),
      ...lines.map(([s, font], i) =>
        text(s, { font, size: 0.52, x: x + 0.7, y: top + 2.8 + i * 0.8, maxWidth: inner }),
      ),
      rect(x + 0.7, top + 6.2, inner, 0.04, C.ink),
      text("Дата обжарки", {
        font: F.textSemi,
        size: 0.46,
        x: x + 0.7,
        y: top + 7.3,
        fill: C.inkMuted,
        tracking: 0.08,
      }),
      text("четверг", {
        font: F.hand,
        size: 1.1,
        x: x + 0.7,
        y: top + 8.6,
        fill: C.terracotta,
        rotate: -3,
      }),
      text("ул. Короля, 9", {
        font: F.text,
        size: 0.46,
        x: x + pw - 0.7,
        y: top + 7.3,
        anchor: "end",
        fill: C.inkMuted,
      }),
      text("250 г", {
        font: F.displayMed,
        size: 0.62,
        x: x + pw - 0.7,
        y: top + 8.5,
        anchor: "end",
      }),
      text("у вас на 1–3 день после обжарки", {
        font: F.hand,
        size: 0.85,
        x: w / 2,
        y: top + 11.3,
        anchor: "middle",
        fill: C.surface100,
        maxWidth: w - 3,
      }),
    ].join("");
  };
}

/** Боковая складка: вордмарк вдоль высоты */
function bagSide(p) {
  return (w, h) =>
    rect(w / 2 - 0.9, 0, 1.8, h, C.surface100) + wordmark(w / 2 + 0.45, h * 0.52, 0.9, p.body, -90);
}

/* ---------- Коробка дрип-пакетов ---------- */

const VARIETIES = [
  ["Эфиопия", C.sage],
  ["Колумбия", C.coral],
  ["Бразилия", C.denim],
];

function boxFront(w, h) {
  const m = h - 0.36;
  const tx = m + 0.42;
  return [
    mark(0.18, 0.18, m),
    text("ДРИП-ПАКЕТЫ", { font: F.display, size: 0.27, x: tx, y: 0.52, maxWidth: w - tx - 0.18 }),
    text("АССОРТИ · 10 ШТ", {
      font: F.textSemi,
      size: 0.12,
      x: tx,
      y: 0.75,
      tracking: 0.16,
      fill: C.inkMuted,
    }),
    ...VARIETIES.map(
      ([name, color], i) =>
        half(tx + 0.14, 1.1 + i * 0.2, 0.12, color) +
        text(name, { font: F.text, size: 0.12, x: tx + 0.34, y: 1.1 + i * 0.2 }),
    ),
    text("повесь на чашку", {
      font: F.hand,
      size: 0.2,
      x: w - 0.16,
      y: h - 0.14,
      anchor: "end",
      fill: C.terracotta,
      rotate: -4,
    }),
  ].join("");
}

function boxBack(w, h) {
  const steps = ["Повесьте пакет на чашку", "Залейте водой", "Кофе готов: дома, в офисе, в дороге"];
  return [
    text("КАК ЗАВАРИТЬ", { font: F.display, size: 0.18, x: 0.25, y: 0.45 }),
    ...steps.map(
      (s, i) =>
        circle(0.37, 0.75 + i * 0.32, 0.11, VARIETIES[i][1]) +
        text(String(i + 1), {
          font: F.displayMed,
          size: 0.12,
          x: 0.37,
          y: 0.79 + i * 0.32,
          anchor: "middle",
          fill: C.surface100,
        }) +
        text(s, { font: F.text, size: 0.13, x: 0.6, y: 0.8 + i * 0.32, maxWidth: w - 0.85 }),
    ),
    text("Мастерская обжарки «Кварта» · Минск, ул. Короля, 9", {
      font: F.text,
      size: 0.09,
      x: 0.25,
      y: h - 0.2,
      fill: C.inkMuted,
      maxWidth: w - 0.5,
    }),
  ].join("");
}

function boxTop(w, h) {
  const stripe = h / 3;
  return [
    ...VARIETIES.map(([, color], i) => rect(0, i * stripe, 0.35, stripe, color)),
    wordmark(w / 2 + 0.17, h / 2 - 0.16, 0.32, C.ink),
  ].join("");
}

function boxEnd(w, h) {
  const band = 0.35;
  return [
    ...VARIETIES.map(([, color], i) => rect(0, h - band + (i * band) / 3, w, band / 3, color)),
    wordmark(w / 2, h / 2 - 0.35, 0.18, C.ink),
    text("10 шт", { font: F.displayMed, size: 0.16, x: w / 2, y: h / 2 + 0.25, anchor: "middle" }),
  ].join("");
}

/** Рисует bag-<сорт>.webp и box-drip.webp в outDir */
export async function renderLabels({ frames: faceFrames, fonts, outDir }) {
  frames = faceFrames;
  F = fonts;

  for (const [id, p] of Object.entries(BAGS)) {
    await render(
      `${outDir}/bag-${id}.webp`,
      [
        face("bag", "+Z", bagFront(p)),
        face("bag", "-Z", bagBack(p)),
        face("bag", "+X", bagSide(p)),
        face("bag", "-X", bagSide(p)),
      ],
      p.body,
    );
  }

  await render(
    `${outDir}/box-drip.webp`,
    [
      face("box", "+Z", boxFront),
      face("box", "-Z", boxBack),
      face("box", "+Y", boxTop),
      face("box", "+X", boxEnd),
      face("box", "-X", boxEnd),
    ],
    C.surface100,
  );
}
