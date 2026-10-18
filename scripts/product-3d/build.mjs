// Собирает ассеты для 3D-товаров (src/components/Product3D):
//   references/models/{paper_bag,box}.glb  →  public/models/{paper_bag,box}.glb
//     (без чужих текстур и печати, коробка с новой UV-раскладкой)
//   этикетки по UV-развёртке               →  public/textures/{bag-*,box-drip}.webp
// Запуск: npm run build:3d
// Тексты и цвета этикеток — в labels.mjs.
import { mkdirSync } from "node:fs";
import { loadFonts } from "./fonts.mjs";
import { renderLabels } from "./labels.mjs";
import { processModels } from "./models.mjs";

const SRC = "references/models";
const MODELS_OUT = "public/models";
const TEXTURES_OUT = "public/textures";

mkdirSync(MODELS_OUT, { recursive: true });
mkdirSync(TEXTURES_OUT, { recursive: true });

const { frames, kraft } = await processModels(SRC, MODELS_OUT);
for (const [model, faces] of Object.entries(frames)) {
  for (const [face, { maxError }] of Object.entries(faces)) {
    // Ошибка подгонки в долях атласа: больше ~0.02 — этикетка заметно поплывёт на этой грани
    console.log(`${model} ${face}: ошибка UV ${maxError.toFixed(4)}`);
  }
}

await renderLabels({ frames, kraft, fonts: await loadFonts(), outDir: TEXTURES_OUT });
console.log(`Готово: ${MODELS_OUT}, ${TEXTURES_OUT}`);
