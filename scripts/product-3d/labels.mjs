// Этикетки для пачек и коробки дрипов: SVG в координатах граней модели → WebP-атлас
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { printOnKraft } from "./kraft.mjs";

const SIZE = 2048;

// Токены из src/app/globals.css
const C = {
  white: "#ffffff",
  navy: "#1c2b5f",
  navyMuted: "#5d6790",
  gold: "#9c8659",
  goldDeep: "#7a6741",
  gold200: "#ede6d8",
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
  { font, size, x = 0, y = 0, anchor = "start", fill = C.navy, tracking = 0, maxWidth, rotate = 0 },
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

/** Знак 2×2 плитки, левый верхний угол в (x, y), сторона size; на синем фоне синие плитки белеют */
function mark(x, y, size, bg) {
  const tile = bg === C.navy ? C.white : C.navy;
  const inset = bg === C.navy ? C.gold200 : C.white;
  return `<g transform="translate(${x} ${y}) scale(${size / 160})">
    <rect width="80" height="80" fill="${tile}"/>
    <g transform="rotate(35 40 40)">
      <ellipse cx="40" cy="40" rx="24" ry="35" fill="${inset}"/>
      <path d="M40 7C29 27 51 53 40 73" fill="none" stroke="${C.navy}" stroke-width="5" stroke-linecap="round"/>
    </g>
    <rect x="80" width="80" height="80" fill="${C.gold}"/>
    <path d="M160 0V80A80 80 0 0 1 80 0Z" fill="${C.white}"/>
    <rect y="80" width="80" height="80" fill="${C.gold}"/>
    <g transform="translate(15 85) scale(0.5)"><g clip-path="url(#lc)">
      <path d="${LETTERS[0]}" fill="none" stroke="${C.white}" stroke-width="22"/>
    </g></g>
    <rect x="80" y="80" width="80" height="80" fill="${tile}"/>
    <path d="M85 155A76 76 0 0 1 155 85A76 76 0 0 1 85 155Z" fill="${inset}"/>
    <path d="M95 145C114 137 126 103 145 95" fill="none" stroke="${C.navy}" stroke-width="5" stroke-linecap="round"/>
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
const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
const rect = (x, y, w, h, fill, r = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;

/* ---------- Грани ---------- */

/** Во сколько раз единицы рисования крупнее единиц модели: скан пачки — в метрах, рисуем в сантиметрах */
const UNIT = { bag: 100, box: 1 };

/**
 * draw(w, h) рисует грань в её координатах: x вправо, y вниз от верхнего левого угла,
 * в единицах UNIT. Грань растеризуется плоско (в 2× от плотности атласа),
 * а в атлас кладётся картинкой с аффинной матрицей — так текст не рендерится под перекосом.
 */
async function face(model, name, draw) {
  const { bounds, matrix } = frames[model][name];
  const [s0, t0, s1, t1] = bounds;
  const [a, b, c, d, e, g] = matrix;
  const w = s1 - s0;
  const h = t1 - t0;
  const k = UNIT[model];
  const px = 2 * SIZE * Math.max(Math.hypot(a, b), Math.hypot(c, d));
  const flat = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(w * px)}" height="${Math.ceil(h * px)}" viewBox="0 0 ${w * k} ${h * k}"><defs>${CLIP}</defs>${draw(w * k, h * k)}</svg>`;
  const png = await sharp(Buffer.from(flat)).png().toBuffer();
  return `<g transform="scale(${SIZE}) matrix(${a} ${b} ${c} ${d} ${e} ${g}) translate(${s0} ${t0})">
    <image width="${w}" height="${h}" preserveAspectRatio="none" href="data:image/png;base64,${png.toString("base64")}"/></g>`;
}

async function render(file, layers, bg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>${(await Promise.all(layers)).join("")}</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(file);
}

/** То же, но слои — краска поверх крафта скана (RGB SIZE×SIZE) */
async function renderOnKraft(file, layers, kraft) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">${(await Promise.all(layers)).join("")}</svg>`;
  const ink = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
  const rgb = await printOnKraft(kraft, ink, SIZE);
  await sharp(rgb, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .webp({ quality: 90 })
    .toFile(file);
}

/* ---------- Пачки: синяя печать по крафту (размеры в сантиметрах) ---------- */

/** Внутренность SVG-файла без корневого тега */
const svgBody = (file) => {
  const src = readFileSync(file, "utf8");
  return src.slice(src.indexOf(">", src.indexOf("<svg")) + 1, src.lastIndexOf("</svg>"));
};

// Ковш из кофейного сета: viewBox 2257 1195 609 636, один цвет — синий
const SCOOP = svgBody("public/coffee_set/scoop.svg");
const SCOOP_RATIO = 609 / 636;

/** Ковш: левый верх в (x, y), высота h */
const scoop = (x, y, h) =>
  `<g transform="translate(${x} ${y}) scale(${h / 636}) translate(-2257 -1195)">${SCOOP}</g>`;

/** Паттерны сортов 1920×1080 без фона; color — исходный цвет заливки, его перекрашиваем */
const PATTERNS = {
  ethiopia: { body: svgBody("public/patterns/ephiopian.svg"), color: "#9c8659" },
  colombia: { body: svgBody("public/patterns/colombian.svg"), color: "#7a6741" },
  brazil: { body: svgBody("public/patterns/brazilian.svg"), color: C.navy },
};

let uid = 0;

/** Замощает прямоугольник паттерном сорта; tile — ширина плитки, ox/oy — сдвиг раскладки в плитках */
function pattern(id, x, y, w, h, fill, { tile, ox = 0, oy = 0 }) {
  const { body, color } = PATTERNS[id];
  const th = (tile * 1080) / 1920;
  const clip = `pt${uid++}`;
  let tiles = "";
  for (let ty = y - oy * th; ty < y + h; ty += th)
    for (let tx = x - ox * tile; tx < x + w; tx += tile) {
      // У эфиопского паттерна своя маска — id в каждой плитке должен быть уникальным
      const mask = `cut${uid++}`;
      const t = body
        .replaceAll(color, fill)
        .replaceAll('id="cut"', `id="${mask}"`)
        .replaceAll("url(#cut)", `url(#${mask})`);
      tiles += `<svg x="${tx}" y="${ty}" width="${tile}" height="${th}" viewBox="0 0 1920 1080">${t}</svg>`;
    }
  return `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${clip})">${tiles}</g>`;
}

/**
 * Синяя плашка «вывороткой»: всё, что holes рисует чёрным, остаётся непропечатанным крафтом.
 * Чёрный — цвет маски, а не краски.
 */
const HOLE = "#000";
function knockout(x, y, w, h, holes) {
  const id = `ko${uid++}`;
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}">
    ${rect(x, y, w, h, C.white)}${holes}</mask>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.navy}" mask="url(#${id})"/>`;
}

const caps = (str, opts) =>
  text(str.toUpperCase(), { font: F.textSemi, tracking: 0.22, fill: C.navy, ...opts });

const BAGS = {
  ethiopia: {
    name: "Эфиопия",
    origin: "Иргачеффе",
    notes: "цветочный, бергамот",
    tag: "светлая обжарка",
  },
  colombia: {
    name: "Колумбия",
    origin: "Уила",
    notes: "карамель, красное яблоко",
    tag: "на каждый день",
  },
  brazil: { name: "Бразилия", origin: "Серрадо", notes: "орех, шоколад", tag: "под эспрессо" },
};

const ABOUT = [
  ["Мастерская обжарки в Минске.", "textSemi"],
  ["Жарим партиями по 5 кг каждый четверг,", "text"],
  ["в пятницу развозим по городу —", "text"],
  ["зерно у вас на 1–3 день после обжарки.", "text"],
];

/** Ширина вордмарка при высоте букв height */
const wordmarkWidth = (height) => (height * 568) / 112;

/** Перёд: сверху на крафте ковш и вордмарк, ниже синяя плашка с сортом и паттерном вывороткой */
function bagFront(id, p) {
  return (w, h) => {
    const scoopH = 5.4;
    const tx = 1.5 + scoopH * SCOOP_RATIO + 0.7;
    // Верх синей плашки; выше — клапан и сгиб пачки
    const top = 9.0;
    return [
      scoop(1.5, 2.2, scoopH),
      wordmark(tx + wordmarkWidth(1.0) / 2, 4.0, 1.0, C.navy),
      caps("Обжарка · Минск · с 2019", { size: 0.34, x: tx, y: 6.0, maxWidth: w - tx - 1.2 }),
      knockout(
        -1,
        top,
        w + 2,
        h - top + 1,
        [
          text(p.name.toUpperCase(), {
            font: F.display,
            size: 1.45,
            x: 1.5,
            y: top + 1.95,
            fill: HOLE,
            maxWidth: w - 3,
          }),
          caps(`${p.origin} · ${p.tag}`, {
            size: 0.4,
            x: 1.5,
            y: top + 2.9,
            fill: HOLE,
            tracking: 0.16,
            maxWidth: w - 5.5,
          }),
          text("250 г", {
            font: F.displayMed,
            size: 0.5,
            x: w - 1.5,
            y: top + 2.9,
            anchor: "end",
            fill: HOLE,
          }),
          text(p.notes, {
            font: F.text,
            size: 0.6,
            x: 1.5,
            y: top + 3.85,
            fill: HOLE,
            maxWidth: w - 3,
          }),
          pattern(id, -1, top + 4.7, w + 2, h - top - 3.7, HOLE, { tile: 19, ox: 0.15, oy: 0.08 }),
        ].join(""),
      ),
    ].join("");
  };
}

/** Оборот: о мастерской на крафте, внизу плашка с вордмарком */
function bagBack(p) {
  return (w, h) => {
    const x = 2.3;
    const top = 14.2;
    return [
      ...ABOUT.map(([str, font], i) =>
        text(str, {
          font: F[font],
          size: 0.5,
          x,
          y: 5.8 + i * 0.82,
          maxWidth: w - 2 * x,
          fill: C.navy,
        }),
      ),
      caps("ул. Короля, 9 · Минск", { size: 0.34, x, y: 9.8 }),
      knockout(
        -1,
        top,
        w + 2,
        h - top + 1,
        wordmark(w / 2, top + 2.2, 1.1, HOLE) +
          caps(`${p.name} · ${p.origin}`, {
            size: 0.38,
            x: w / 2,
            y: top + 4.4,
            anchor: "middle",
            fill: HOLE,
          }),
      ),
    ].join("");
  };
}

/** Боковая складка: сплошная плашка, вордмарк вдоль высоты вывороткой */
function bagSide(w, h) {
  return knockout(-0.5, -0.5, w + 1, h + 1, wordmark(w / 2 + 0.35, h * 0.45, 0.7, HOLE, -90));
}

/* ---------- Коробка дрип-пакетов ---------- */

const VARIETIES = [
  ["Эфиопия", C.gold],
  ["Колумбия", C.goldDeep],
  ["Бразилия", C.navy],
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
      fill: C.navyMuted,
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
      fill: C.goldDeep,
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
          fill: C.white,
        }) +
        text(s, { font: F.text, size: 0.13, x: 0.6, y: 0.8 + i * 0.32, maxWidth: w - 0.85 }),
    ),
    text("Мастерская обжарки «Кварта» · Минск, ул. Короля, 9", {
      font: F.text,
      size: 0.09,
      x: 0.25,
      y: h - 0.2,
      fill: C.navyMuted,
      maxWidth: w - 0.5,
    }),
  ].join("");
}

function boxTop(w, h) {
  const stripe = h / 3;
  return [
    ...VARIETIES.map(([, color], i) => rect(0, i * stripe, 0.35, stripe, color)),
    wordmark(w / 2 + 0.17, h / 2 - 0.16, 0.32, C.navy),
  ].join("");
}

function boxEnd(w, h) {
  const band = 0.35;
  return [
    ...VARIETIES.map(([, color], i) => rect(0, h - band + (i * band) / 3, w, band / 3, color)),
    wordmark(w / 2, h / 2 - 0.35, 0.18, C.navy),
    text("10 шт", { font: F.displayMed, size: 0.16, x: w / 2, y: h / 2 + 0.25, anchor: "middle" }),
  ].join("");
}

/** Рисует bag-<сорт>.webp и box-drip.webp в outDir; kraft — диффузная карта скана пачки (PNG) */
export async function renderLabels({ frames: faceFrames, kraft, fonts, outDir }) {
  frames = faceFrames;
  F = fonts;

  const paper = await sharp(kraft)
    .resize(SIZE, SIZE, { kernel: "lanczos3" })
    .removeAlpha()
    .raw()
    .toBuffer();
  for (const [id, p] of Object.entries(BAGS)) {
    await renderOnKraft(
      `${outDir}/bag-${id}.webp`,
      [
        face("bag", "+Z", bagFront(id, p)),
        face("bag", "-Z", bagBack(p)),
        face("bag", "+X", bagSide),
        face("bag", "-X", bagSide),
      ],
      paper,
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
    C.white,
  );
}
