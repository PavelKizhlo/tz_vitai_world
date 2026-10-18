import type { CSSProperties } from "react";
import styles from "./ui.module.css";

/*
 * Фоновые иллюстрации из public/coffee_set. Файл служит маской, а цвет даёт фон элемента,
 * поэтому рисунок всегда в цветах темы. Пропорции берутся из файла: className задаёт только
 * ширину, положение и поворот (свойство rotate, чтобы не спорить с transform и параллаксом).
 */

const SIZES = {
  "beans-pair": [453, 276],
  "beans-pile": [431, 262],
  "beans-row": [903, 216],
  "beans-scattered": [418, 468],
  "beans-stages": [965, 278],
  "berry-branch": [582, 875],
  "branch-leaves": [738, 800],
  cherries: [380, 266],
  cup: [631, 476],
  plant: [792, 817],
  sack: [668, 606],
  scoop: [609, 636],
  spoon: [812, 353],
} as const;

export type SketchName = keyof typeof SIZES;

type SketchProps = {
  name: SketchName;
  /** Скорость параллакса при скролле, доля от 1 (см. Motion/ScrollScenes) */
  parallax?: number;
  className?: string;
};

export function Sketch({ name, parallax, className }: SketchProps) {
  const [width, height] = SIZES[name];
  const mask = `url(/coffee_set/${name}.svg)`;
  const style: CSSProperties = {
    aspectRatio: `${width} / ${height}`,
    maskImage: mask,
    WebkitMaskImage: mask,
  };

  return (
    <span
      aria-hidden="true"
      className={[styles.sketch, className].filter(Boolean).join(" ")}
      style={style}
      data-parallax={parallax}
    />
  );
}
