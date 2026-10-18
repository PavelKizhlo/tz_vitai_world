// Чистит .glb от чужих текстур, коробке строит новую UV-раскладку
// и для каждой грани считает аффинное преобразование «координаты грани → UV»
import { NodeIO } from "@gltf-transform/core";
import { KHRMaterialsPBRSpecularGlossiness } from "@gltf-transform/extensions";
import { dedup, prune, unweld, weld } from "@gltf-transform/functions";
import { erasePrint } from "./kraft.mjs";

/** Поворот коробки вокруг Y — должен совпадать с MODELS.box.rotation в src/components/Product3D/config.ts */
const BOX_YAW = -Math.PI / 2;

// Локальный базис грани, как её видит зритель снаружи: right и down в мировых осях
const FRAMES = {
  "+Z": { r: [1, 0, 0], d: [0, -1, 0] },
  "-Z": { r: [-1, 0, 0], d: [0, -1, 0] },
  "+X": { r: [0, 0, -1], d: [0, -1, 0] },
  "-X": { r: [0, 0, 1], d: [0, -1, 0] },
  "+Y": { r: [1, 0, 0], d: [0, 0, 1] },
  "-Y": { r: [1, 0, 0], d: [0, 0, -1] },
};

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => a.map((v, k) => v - b[k]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const rotY = (p, a) => [
  p[0] * Math.cos(a) + p[2] * Math.sin(a),
  p[1],
  -p[0] * Math.sin(a) + p[2] * Math.cos(a),
];

/** Все треугольники в мировых координатах (с учётом узлов glTF и поворота yaw) и грань, к которой они относятся */
function triangles(doc, yaw) {
  const out = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const M = node.getWorldMatrix();
    const toWorld = (p) =>
      rotY(
        [0, 1, 2].map((c) => M[c] * p[0] + M[4 + c] * p[1] + M[8 + c] * p[2] + M[12 + c]),
        yaw,
      );
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      const idx = prim.getIndices();
      const count = idx ? idx.getCount() : pos.getCount();
      for (let i = 0; i < count; i += 3) {
        const ids = [0, 1, 2].map((k) => (idx ? idx.getScalar(i + k) : i + k));
        const P = ids.map((j) => toWorld(pos.getElement(j, [])));
        const n = cross(sub(P[1], P[0]), sub(P[2], P[0]));
        const abs = n.map(Math.abs);
        const k = abs.indexOf(Math.max(...abs));
        out.push({ prim, ids, P, face: (n[k] >= 0 ? "+" : "-") + "XYZ"[k] });
      }
    }
  }
  return out;
}

const area = (P) => Math.hypot(...cross(sub(P[1], P[0]), sub(P[2], P[0]))) / 2;

function invert3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

/** Наименьшие квадраты: [u v] = [s t 1] · A, где A — матрица 3×2 */
function fitAffine(rows) {
  const ata = Array.from({ length: 3 }, () => [0, 0, 0]);
  const atb = Array.from({ length: 3 }, () => [0, 0]);
  for (const { s, t, u, v } of rows) {
    const x = [s, t, 1];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) ata[i][j] += x[i] * x[j];
      atb[i][0] += x[i] * u;
      atb[i][1] += x[i] * v;
    }
  }
  const inv = invert3(ata);
  const A = [0, 1, 2].map((i) =>
    [0, 1].map((c) => inv[i].reduce((sum, m, j) => sum + m * atb[j][c], 0)),
  );
  let err = 0;
  for (const { s, t, u, v } of rows) {
    const pu = s * A[0][0] + t * A[1][0] + A[2][0];
    const pv = s * A[0][1] + t * A[1][1] + A[2][1];
    err = Math.max(err, Math.hypot(pu - u, pv - v));
  }
  return { A, err };
}

/** UV-острова: треугольники, связанные общими вершинами (на швах вершины разведены) */
function markIslands(tris) {
  const parent = new Map();
  const find = (x) => {
    while (parent.get(x) !== x) x = parent.get(x);
    return x;
  };
  const key = (tri, j) => `${tri.prim.getName()}#${j}`;
  for (const tri of tris)
    for (const j of tri.ids) if (!parent.has(key(tri, j))) parent.set(key(tri, j), key(tri, j));
  for (const tri of tris) {
    const [a, ...rest] = tri.ids.map((j) => find(key(tri, j)));
    for (const b of rest) parent.set(find(b), a);
  }
  for (const tri of tris) tri.island = find(key(tri, tri.ids[0]));
}

/**
 * Для каждой грани: границы в её координатах и SVG-матрица в единицы UV (0..1).
 * Матрица подбирается по самому крупному UV-острову грани — края, загнутые на соседние
 * острова, иначе портят подгонку. Границы — по всей грани; mainOnly ограничивает их тем же
 * островом: у скана пачки к грани относятся и загибы шва, и этикетка залезла бы на чужие острова.
 */
function faceFrames(tris, { mainOnly = false } = {}) {
  markIslands(tris);
  const frames = {};
  for (const [face, { r, d }] of Object.entries(FRAMES)) {
    const own = tris.filter((t) => t.face === face);
    if (!own.length) continue;
    const islandArea = new Map();
    for (const tri of own)
      islandArea.set(tri.island, (islandArea.get(tri.island) ?? 0) + area(tri.P));
    const main = [...islandArea].sort((a, b) => b[1] - a[1])[0][0];

    const mainTris = own.filter((t) => t.island === main);
    const rows = [];
    for (const tri of mainTris) {
      const uv = tri.prim.getAttribute("TEXCOORD_0");
      tri.ids.forEach((j, k) => {
        const [u, v] = uv.getElement(j, []);
        rows.push({ s: dot(tri.P[k], r), t: dot(tri.P[k], d), u, v });
      });
    }
    const { A, err } = fitAffine(rows);
    const edge = mainOnly ? mainTris : own;
    const ss = edge.flatMap((tri) => tri.P.map((p) => dot(p, r)));
    const ts = edge.flatMap((tri) => tri.P.map((p) => dot(p, d)));
    frames[face] = {
      bounds: [Math.min(...ss), Math.min(...ts), Math.max(...ss), Math.max(...ts)],
      matrix: [A[0][0], A[0][1], A[1][0], A[1][1], A[2][0], A[2][1]],
      maxError: err,
    };
  }
  return frames;
}

function stripTextures(doc) {
  for (const m of doc.getRoot().listMaterials()) {
    m.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null);
    m.setOcclusionTexture(null).setEmissiveTexture(null);
  }
  for (const prim of doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())) {
    prim.setAttribute("TANGENT", null);
  }
}

/** Коробка: каждая грань получает свой прямоугольник в атласе. Ряды: перед | зад; верх | низ; торцы */
function relayoutBox(doc) {
  const tris = triangles(doc, BOX_YAW);
  const ext = {};
  for (const tri of tris) {
    const { r, d } = FRAMES[tri.face];
    const e = (ext[tri.face] ??= { s0: Infinity, t0: Infinity, s1: -Infinity, t1: -Infinity });
    for (const p of tri.P) {
      const s = dot(p, r);
      const t = dot(p, d);
      e.s0 = Math.min(e.s0, s);
      e.s1 = Math.max(e.s1, s);
      e.t0 = Math.min(e.t0, t);
      e.t1 = Math.max(e.t1, t);
    }
  }
  const w = (f) => ext[f].s1 - ext[f].s0;
  const h = (f) => ext[f].t1 - ext[f].t0;
  const gap = 0.08;
  const slots = {};
  let y = gap;
  for (const row of [
    ["+Z", "-Z"],
    ["+Y", "-Y"],
    ["+X", "-X"],
  ]) {
    let x = gap;
    for (const f of row) {
      slots[f] = { x, y };
      x += w(f) + gap;
    }
    y += Math.max(...row.map(h)) + gap;
  }
  const width = Math.max(...Object.keys(slots).map((f) => slots[f].x + w(f))) + gap;
  const size = Math.max(width, y);
  for (const tri of tris) {
    const { r, d } = FRAMES[tri.face];
    const e = ext[tri.face];
    const slot = slots[tri.face];
    const uv = tri.prim.getAttribute("TEXCOORD_0");
    tri.ids.forEach((j, k) => {
      const s = dot(tri.P[k], r) - e.s0;
      const t = dot(tri.P[k], d) - e.t0;
      uv.setElement(j, [(slot.x + s) / size, (slot.y + t) / size]);
    });
  }
}

/**
 * Пачка — 3D-скан бумажного пакета: крафт из его диффузной карты становится фоном этикеток,
 * карта нормалей остаётся в модели ради складок бумаги. С обеих стираем чужую печать.
 * Возвращает диффузную карту (PNG) — без неё в модели остаются только нормали.
 */
async function prepareScan(doc) {
  const material = doc.getRoot().listMaterials()[0];
  const specGloss = material.getExtension(KHRMaterialsPBRSpecularGlossiness.EXTENSION_NAME);
  const kraft = await erasePrint(specGloss.getDiffuseTexture().getImage());
  const normal = material.getNormalTexture();
  normal.setImage(await erasePrint(normal.getImage(), { whole: true }));
  // Затенение уже запечено в диффузную карту скана, AO и глянец не нужны
  material.setOcclusionTexture(null).setBaseColorTexture(null);
  for (const ext of doc.getRoot().listExtensionsUsed()) ext.dispose();
  return kraft;
}

/**
 * Обрабатывает paper_bag.glb и box.glb из srcDir, пишет результат в outDir.
 * Возвращает рамки граней обеих моделей и крафт пачки.
 */
export async function processModels(srcDir, outDir) {
  const io = new NodeIO().registerExtensions([KHRMaterialsPBRSpecularGlossiness]);
  // keepAttributes: иначе prune выбросит UV, на которые больше не ссылается ни одна текстура
  const cleanup = [prune({ keepAttributes: true }), dedup()];

  const bag = await io.read(`${srcDir}/paper_bag.glb`);
  const kraft = await prepareScan(bag);
  await bag.transform(...cleanup);
  await io.write(`${outDir}/paper_bag.glb`, bag);

  const box = await io.read(`${srcDir}/box.glb`);
  stripTextures(box);
  // Разводим вершины по граням, чтобы у каждой грани была своя развёртка
  await box.transform(unweld());
  relayoutBox(box);
  await box.transform(weld(), ...cleanup);
  await io.write(`${outDir}/box.glb`, box);

  return {
    frames: {
      bag: faceFrames(triangles(bag, 0), { mainOnly: true }),
      box: faceFrames(triangles(box, BOX_YAW)),
    },
    kraft,
  };
}
