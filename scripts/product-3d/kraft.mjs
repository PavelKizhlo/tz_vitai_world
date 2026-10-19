// Крафт со скана пачки: стирание чужой печати и печать нашего дизайна по бумаге
import sharp from "sharp";

/**
 * Печать на скане, в долях атласа: щит THE CAFÉ, надпись 250g, красная плашка.
 * В диффузной карте у щита и надписи стираем только тёмные штрихи, плашку — целиком;
 * в карте нормалей заливаем целиком все три, иначе рельеф букв проступает под нашим дизайном.
 */
const STROKES = [
  [0.098, 0.191, 0.232, 0.332],
  [0.131, 0.016, 0.205, 0.059],
];
const BLOCKS = [[0.086, 0.088, 0.252, 0.148]];

function boxBlur(src, W, H, r) {
  const tmp = new Float32Array(W * H);
  const out = new Float32Array(W * H);
  const at = (v, max) => Math.min(max - 1, Math.max(0, v));
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let x = -r; x <= r; x++) s += src[y * W + at(x, W)];
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = s / (2 * r + 1);
      s += src[y * W + at(x + r + 1, W)] - src[y * W + at(x - r, W)];
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[at(y, H) * W + x];
    for (let y = 0; y < H; y++) {
      out[y * W + x] = s / (2 * r + 1);
      s += tmp[at(y + r + 1, H) * W + x] - tmp[at(y - r, H) * W + x];
    }
  }
  return out;
}

/** Три прохода box blur ≈ гаусс */
function blur(src, W, H, r) {
  let a = src;
  for (let k = 0; k < 3; k++) a = boxBlur(a, W, H, r);
  return a;
}

/**
 * Стирает печать скана: маска заливается средним по окрестности,
 * сверху кладётся зерно бумаги из соседнего чистого участка.
 * whole — заливать области целиком, а не только тёмные штрихи.
 */
export async function erasePrint(png, { whole = false } = {}) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const N = W * H;
  const ch = [0, 1, 2].map((c) => Float32Array.from({ length: N }, (_, i) => data[i * 3 + c]));
  const L = ch[0].map((r, i) => 0.3 * r + 0.59 * ch[1][i] + 0.11 * ch[2][i]);
  const Lb = blur(L, W, H, Math.round(W / 100));

  let mask = new Float32Array(N);
  const each = (boxes, test) => {
    for (const box of boxes) {
      const [x0, y0, x1, y1] = box.map((v, k) => Math.round(v * (k % 2 ? H : W)));
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) if (test(y * W + x)) mask[y * W + x] = 1;
    }
  };
  each(STROKES, (i) => whole || L[i] < Lb[i] - 6);
  each(BLOCKS, () => true);
  mask = boxBlur(mask, W, H, Math.round(W / 200)).map((m) => (m > 0.01 ? 1 : 0));

  const keep = mask.map((m) => 1 - m);
  const r = Math.round(W / (whole ? 21 : 73));
  const weight = blur(keep, W, H, r);
  const shift = Math.round(W / 22) * W;
  const out = Buffer.alloc(N * 3);
  ch.forEach((src, c) => {
    const fill = blur(
      src.map((v, i) => v * keep[i]),
      W,
      H,
      r,
    );
    const low = blur(src, W, H, Math.round(W / 170));
    for (let i = 0; i < N; i++) {
      let v = src[i];
      if (mask[i]) {
        const j = i + shift;
        const grain = j < N && !mask[j] ? src[j] - low[j] : 0;
        v = fill[i] / Math.max(weight[i], 1e-3) + grain * 0.9;
      }
      out[i * 3 + c] = Math.max(0, Math.min(255, Math.round(v)));
    }
  });
  return sharp(out, { raw: { width: W, height: H, channels: 3 } })
    .png()
    .toBuffer();
}

/**
 * Печать по крафту: краска берёт светотень и волокно бумаги из скана.
 * kraft — RGB, ink — RGBA одного размера; возвращает RGB.
 */
export async function printOnKraft(kraft, ink, size) {
  const raw = { raw: { width: size, height: size, channels: 3 } };
  const fibers = await sharp(kraft, raw)
    .blur(size / 400)
    .raw()
    .toBuffer();
  const N = size * size;
  const lum = (i) => 0.3 * kraft[i * 3] + 0.59 * kraft[i * 3 + 1] + 0.11 * kraft[i * 3 + 2];

  // Светотень считаем от средней яркости бумаги под краской
  let sum = 0;
  let count = 0;
  for (let i = 0; i < N; i++)
    if (ink[i * 4 + 3] > 128) {
      sum += lum(i);
      count++;
    }
  const ref = count ? sum / count : 1;

  const out = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) {
    const a = (ink[i * 4 + 3] / 255) * 0.95;
    const shade = Math.min(1.05, Math.max(0.55, lum(i) / ref));
    for (let c = 0; c < 3; c++) {
      const paper = kraft[i * 3 + c];
      const fiber = paper / Math.max(1, fibers[i * 3 + c]);
      const color = ink[i * 4 + c] * shade * (1 + 0.45 * (fiber - 1));
      out[i * 3 + c] = Math.max(0, Math.min(255, Math.round(paper * (1 - a) + color * a)));
    }
  }
  return out;
}

/** Гауссов шум со средним 128 из генератора с сидом — атлас не меняется от сборки к сборке */
function noise(size, sigma, seed) {
  // mulberry32
  let state = seed;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const buf = Buffer.alloc(size * size);
  for (let i = 0; i < buf.length; i++) {
    // Бокс — Мюллер
    const g = Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
    buf[i] = Math.max(0, Math.min(255, Math.round(128 + sigma * g)));
  }
  return sharp(buf, { raw: { width: size, height: size, channels: 1 } });
}

/** Гладкий крафт-картон цвета rgb: мелкое волокно и лёгкие пятна; возвращает RGB size×size */
export async function kraftBoard(size, rgb) {
  const fiber = await noise(size, 40, 1).blur(0.8).raw().toBuffer();
  const blots = await noise(size / 8, 40, 2)
    .resize(size, size, { kernel: "cubic" })
    .blur(size / 200)
    .raw()
    .toBuffer();
  const out = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    const k = 1 + (0.035 * (fiber[i] - 128)) / 40 + (0.035 * (blots[i] - 128)) / 40;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.max(0, Math.min(255, Math.round(rgb[c] * k)));
  }
  return out;
}
