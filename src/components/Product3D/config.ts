import type { ProductId } from "@/data/catalog";

export type ModelKind = "bag" | "box";
export type Product3DId = Exclude<ProductId, "subscription">;

type ModelConfig = {
  url: string;
  /** Поворот, при котором лицевая сторона смотрит в камеру (+Z) */
  rotation: [number, number, number];
};

export const MODELS: Record<ModelKind, ModelConfig> = {
  bag: { url: "/models/paper_bag.glb", rotation: [0, 0, 0] },
  box: { url: "/models/box.glb", rotation: [0, 0, 0] },
};

type ProductConfig = {
  model: ModelKind;
  texture: string;
  /** Сдвиг фазы покачивания, чтобы соседние модели не двигались синхронно */
  phase: number;
};

export const PRODUCTS_3D: Record<Product3DId, ProductConfig> = {
  ethiopia: { model: "bag", texture: "/textures/bag-ethiopia.webp", phase: 0 },
  colombia: { model: "bag", texture: "/textures/bag-colombia.webp", phase: 1.7 },
  brazil: { model: "bag", texture: "/textures/bag-brazil.webp", phase: 3.1 },
  drip: { model: "box", texture: "/textures/box-drip.webp", phase: 2.3 },
};

/** Насколько canvas выходит за рамку слота с каждой стороны — запас под поворот модели */
export const BLEED = 0.2;
