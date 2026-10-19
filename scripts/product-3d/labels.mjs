// Этикетки для пачек и коробки дрипов: SVG в координатах граней модели → WebP-атлас
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { kraftBoard, printOnKraft } from "./kraft.mjs";

const SIZE = 2048;

// Токены из src/app/globals.css
const C = {
  white: "#ffffff",
  navy: "#1c2b5f",
};

/** Картон коробки — в тон крафту пачек, каким он выходит на сайте */
const BOARD = [121, 96, 69];

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

/** Вордмарк «КВАРТА»: центр по x, верх в y, высота букв height */
function wordmark(cx, y, height, color, rotate = 0) {
  const letters = LETTERS.map(
    (d, i) => `<g transform="translate(${i * 97.6} 0) scale(0.8)"><g clip-path="url(#lc)">
      <path d="${d}" fill="none" stroke="${color}" stroke-width="16"/></g></g>`,
  ).join("");
  return `<g transform="translate(${cx} ${y}) rotate(${rotate}) scale(${height / 112}) translate(-284 0)">${letters}</g>`;
}

const rect = (x, y, w, h, fill, r = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;

/* ---------- Грани ---------- */

/** Во сколько раз единицы рисования крупнее единиц модели: модели в метрах, рисуем в сантиметрах */
const UNIT = { bag: 100, box: 100 };

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

/** Собирает грани в атлас: краска поверх крафта kraft (RGB SIZE×SIZE) */
async function render(file, layers, kraft) {
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
const scoop = (x, y, h, color = C.navy) =>
  `<g transform="translate(${x} ${y}) scale(${h / 636}) translate(-2257 -1195)">${SCOOP.replaceAll(C.navy, color)}</g>`;

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

/* ---------- Коробка дрип-пакетов: картон с откидной крышкой (размеры в сантиметрах) ---------- */

/** Высота бортика крышки на передней и боковых стенках — от верха грани до низа бортика */
const LID = 3.14;

const BREW = [
  "Раскройте пакет и повесьте на чашку",
  "Залейте около 180 мл горячей воды",
  "Через 3–4 минуты кофе готов",
];

/** Синий кружок с номером шага вывороткой */
function stepBadge(cx, cy, r, n) {
  const id = `sb${uid++}`;
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.white}"/>
    ${text(String(n), { font: F.displayMed, size: r * 1.1, x: cx, y: cy + r * 0.4, anchor: "middle", fill: HOLE })}</mask>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.navy}" mask="url(#${id})"/>`;
}

/** Бортик крышки: синяя плашка, вордмарк и подпись вывороткой */
function lidBand(w, label) {
  return knockout(
    -1,
    -1,
    w + 2,
    LID + 1,
    wordmark(w / 2, 0.95, 0.85, HOLE) +
      caps(label, { size: 0.26, x: w / 2, y: 2.45, anchor: "middle", fill: HOLE }),
  );
}

/** Перёд: под крышкой ковш и название, внизу три паттерна сортов вывороткой */
function boxFront(w, h) {
  // Корпус чуть уже крышки
  const body = 0.18;
  const tx = 4.6;
  const col = (w - 2 * body) / 3;
  const band = 8.1;
  const sorts = Object.entries(BAGS);
  return [
    lidBand(w, "Обжарка · Минск"),
    scoop(0.9, 3.85, 3.2),
    text("ДРИП-ПАКЕТЫ", {
      font: F.display,
      size: 0.62,
      x: tx,
      y: 4.75,
      fill: C.navy,
      maxWidth: w - tx - 0.9,
    }),
    caps("Ассорти · 10 шт", { size: 0.26, x: tx, y: 5.35 }),
    ...["Повесьте на чашку, залейте", "горячей водой — кофе готов."].map((str, i) =>
      text(str, {
        font: F.text,
        size: 0.3,
        x: tx,
        y: 6.1 + i * 0.45,
        fill: C.navy,
        maxWidth: w - tx - 0.9,
      }),
    ),
    ...sorts.map(([, p], i) =>
      caps(p.name, {
        size: 0.22,
        x: body + col * (i + 0.5),
        y: band - 0.35,
        anchor: "middle",
        tracking: 0.16,
      }),
    ),
    knockout(
      -1,
      band,
      w + 2,
      h - band + 1,
      sorts
        .map(([id], i) =>
          pattern(id, body + col * i + 0.05, band + 0.1, col - 0.1, h - band, HOLE, {
            tile: 8,
            ox: 0.2,
          }),
        )
        .join(""),
    ),
  ].join("");
}

/** Оборот: как заварить и о мастерской, внизу адрес */
function boxBack(w, h) {
  const x = 0.9;
  const band = 8.7;
  return [
    text("КАК ЗАВАРИТЬ", { font: F.display, size: 0.5, x, y: 1.6, fill: C.navy }),
    ...BREW.map(
      (str, i) =>
        stepBadge(x + 0.34, 2.55 + i * 1.0, 0.34, i + 1) +
        text(str, {
          font: F.text,
          size: 0.34,
          x: x + 1.05,
          y: 2.67 + i * 1.0,
          fill: C.navy,
          maxWidth: w - x - 1.95,
        }),
    ),
    rect(x, 5.65, w - 2 * x, 0.035, C.navy),
    ...ABOUT.map(([str, font], i) =>
      text(str, {
        font: F[font],
        size: 0.3,
        x,
        y: 6.45 + i * 0.47,
        fill: C.navy,
        maxWidth: w - 2 * x,
      }),
    ),
    knockout(
      -1,
      band,
      w + 2,
      h - band + 1,
      caps("Минск · ул. Короля, 9", {
        size: 0.28,
        x: w / 2,
        y: band + 0.85,
        anchor: "middle",
        fill: HOLE,
      }),
    ),
  ].join("");
}

/** Правый бок (виден в ракурсе 3/4): три сорта с образцами паттерна */
function boxRight(w) {
  const sw = 1.6;
  return [
    lidBand(w, "10 дрип-пакетов"),
    ...Object.entries(BAGS).map(([id, p], i) => {
      const y = 3.9 + i * 2.05;
      return (
        knockout(0.9, y, sw, sw, pattern(id, 0.9, y, sw, sw, HOLE, { tile: 5, ox: 0.3, oy: 0.2 })) +
        text(p.name.toUpperCase(), {
          font: F.display,
          size: 0.42,
          x: 0.9 + sw + 0.5,
          y: y + 0.5,
          fill: C.navy,
        }) +
        caps(`${p.origin} · ${p.tag}`, {
          size: 0.2,
          x: 0.9 + sw + 0.5,
          y: y + 0.95,
          tracking: 0.16,
        }) +
        text(p.notes, {
          font: F.text,
          size: 0.3,
          x: 0.9 + sw + 0.5,
          y: y + 1.45,
          fill: C.navy,
          maxWidth: w - sw - 2.3,
        })
      );
    }),
  ].join("");
}

/** Левый бок: ковш и пара слов о фасовке */
function boxLeft(w) {
  const sh = 3.9;
  return [
    lidBand(w, "Свежая обжарка"),
    scoop(w / 2 - (sh * SCOOP_RATIO) / 2, 3.8, sh),
    ...["Мелем зерно в день фасовки", "и запаиваем каждый пакет отдельно"].map((str, i) =>
      text(str, {
        font: F.text,
        size: 0.32,
        x: w / 2,
        y: 8.55 + i * 0.47,
        anchor: "middle",
        fill: C.navy,
        maxWidth: w - 1.6,
      }),
    ),
  ].join("");
}

/** Крышка: сплошная плашка, ковш и вордмарк вывороткой */
function boxTop(w) {
  const sh = 4.6;
  return knockout(
    -1,
    -1,
    w + 2,
    12,
    scoop(w / 2 - (sh * SCOOP_RATIO) / 2, 1.4, sh, HOLE) +
      wordmark(w / 2, 6.8, 0.95, HOLE) +
      caps("Дрип-пакеты · ассорти · 10 шт", {
        size: 0.28,
        x: w / 2,
        y: 8.75,
        anchor: "middle",
        fill: HOLE,
      }),
  );
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
    await render(
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
      face("box", "+X", boxRight),
      face("box", "-X", boxLeft),
      face("box", "+Y", boxTop),
    ],
    await kraftBoard(SIZE, BOARD),
  );
}
