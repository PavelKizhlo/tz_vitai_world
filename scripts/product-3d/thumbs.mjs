// Плоские превью товаров для формы заявки: грани вырезаются из готовых атласов по контуру модели
import sharp from "sharp";

/** Превью квадратные, товар вписан по центру */
const SIZE = 320;
const PAD = 10;

/** Кабинетная проекция коробки: глубина уходит вправо-вверх под 30° с сокращением вдвое */
const DEPTH = [0.5 * Math.cos(Math.PI / 6), -0.5 * Math.sin(Math.PI / 6)];

let uid = 0;

/**
 * Грань из атласа в её собственных координатах (0..w, 0..h в единицах модели).
 * Атлас кладётся обратной матрицей «грань → UV». outline — вырезать по треугольникам грани
 * (обводка около пикселя превью закрывает щели между ними), иначе грань берётся прямоугольником,
 * расширенным на bleed = [слева, сверху, справа, снизу].
 */
function faceSvg(frame, atlas, { outline = true, bleed = [0, 0, 0, 0] } = {}) {
  const [s0, t0, s1, t1] = frame.bounds;
  const [a, b, c, d, e, f] = frame.matrix;
  const det = a * d - b * c;
  const inv = [d, -b, -c, a, c * f - d * e, b * e - a * f].map((v) => v / det);
  const seam = (s1 - s0) / 120;
  const id = `fm${uid++}`;
  const tris = outline
    ? `<g fill="#fff" stroke="#fff" stroke-width="${seam}" stroke-linejoin="round">${frame.shape
        .map((tri) => `<polygon points="${tri.map(([s, t]) => `${s - s0},${t - t0}`).join(" ")}"/>`)
        .join("")}</g>`
    : rect(s1 - s0, t1 - t0, bleed, "#fff");
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="-1" y="-1" width="1000" height="1000">${tris}</mask>
    <g mask="url(#${id})"><g transform="translate(${-s0} ${-t0}) matrix(${inv.join(" ")}) scale(${1 / atlas.size})">
      <image width="${atlas.size}" height="${atlas.size}" href="${atlas.href}"/></g></g>`;
}

/** Прямоугольник w×h, расширенный на bleed = [слева, сверху, справа, снизу] */
const rect = (w, h, [l, t, r, b], fill, opacity = 1) =>
  `<rect x="${-l}" y="${-t}" width="${w + l + r}" height="${h + t + b}" fill="${fill}" opacity="${opacity}"/>`;

const size = (frame) => [frame.bounds[2] - frame.bounds[0], frame.bounds[3] - frame.bounds[1]];

/** librsvg не читает WebP внутри SVG — атлас подаём как PNG */
async function loadAtlas(file) {
  const png = await sharp(file).png().toBuffer();
  const { width } = await sharp(png).metadata();
  return { size: width, href: `data:image/png;base64,${png.toString("base64")}` };
}

/** Вписывает содержимое шириной w и высотой h (в единицах модели) в квадрат превью */
async function save(file, body, w, h) {
  const k = (SIZE - 2 * PAD) / Math.max(w, h);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <g transform="translate(${(SIZE - w * k) / 2} ${(SIZE - h * k) / 2}) scale(${k})">${body}</g></svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 90, alphaQuality: 90 }).toFile(file);
}

/** Пачка — лицевая сторона по силуэту скана */
async function bagThumb(file, frames, atlas) {
  const front = frames["+Z"];
  await save(file, faceSvg(front, atlas), ...size(front));
}

/**
 * Коробка — перёд, правый бок и крышка в кабинетной проекции. Грани берутся прямоугольниками
 * и подгоняются под общий размер куба: корпус на пару миллиметров уже крышки, и по контуру
 * на ребре оставалась бы щель. Задние грани заходят под передние на пару пикселей — иначе
 * сглаженные края соседних граней просвечивают фоном по рёбрам.
 * Крышка светлее, бок темнее — как под верхним светом.
 */
async function boxThumb(file, frames, atlas) {
  const [fw, fh] = size(frames["+Z"]);
  const [dx, dy] = DEPTH;
  // Глубина куба — по боку; крышку подгоняем под неё и под ширину переда
  const [depth] = size(frames["+X"]);
  const width = fw + depth * dx;
  const px = width / (SIZE - 2 * PAD);
  const b = 2 * px;
  /** Грань, подогнанная под w×h, с тонировкой tint = [цвет, прозрачность] */
  const fit = (frame, w, h, bleed, [tint, opacity]) => {
    const [ow, oh] = size(frame);
    const own = bleed.map((v, i) => v * (i % 2 ? oh / h : ow / w));
    return `<g transform="scale(${w / ow} ${h / oh})">${faceSvg(frame, atlas, { outline: false, bleed: own })}</g>
      ${rect(w, h, bleed, tint, opacity)}`;
  };
  // Сдвиг вниз на высоту проекции крышки, чтобы она не ушла за верх
  const lift = -depth * dy;
  // Бок уходит под перёд (слева) и под крышку (сверху), крышка — под перёд (снизу)
  const side = `<g transform="translate(0 ${lift}) matrix(${dx} ${dy} 0 1 ${fw} 0)">
      ${fit(frames["+X"], depth, fh, [b / dx, b, 0, 0], ["#000", 0.25])}</g>`;
  const top = `<g transform="translate(0 ${lift}) matrix(1 0 ${-dx} ${-dy} ${depth * dx} ${depth * dy})">
      ${fit(frames["+Y"], fw, depth, [0, 0, 0, b / -dy], ["#fff", 0.2])}</g>`;
  const front = `<g transform="translate(0 ${lift})">${fit(frames["+Z"], fw, fh, [0, 0, 0, 0], ["#000", 0])}</g>`;
  await save(file, side + top + front, width, fh + lift);
}

/** products: { id: { model, texture } } — атласы уже лежат в texture */
export async function renderThumbs({ frames, products, outDir }) {
  for (const [id, { model, texture }] of Object.entries(products)) {
    const atlas = await loadAtlas(texture);
    const render = model === "box" ? boxThumb : bagThumb;
    await render(`${outDir}/${id}.webp`, frames[model], atlas);
  }
}
