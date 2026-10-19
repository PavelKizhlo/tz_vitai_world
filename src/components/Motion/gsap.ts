"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export { gsap, ScrollTrigger, SplitText, useGSAP };

/** Сглаживание scrub-анимаций, с */
export const SCRUB = 0.6;
export const EASE_OUT = "power3.out";

/** Насколько ячейка смещена перед въездом: % своей ширины (сбоку) или высоты (снизу) */
export const SLIDE_X = 40;
export const SLIDE_Y = 30;

/** Сдвиг ячейки, когда её ряд уходит вверх, % ширины */
export const DRIFT = 8;
export const EXIT_START = "bottom 60%";
export const EXIT_END = "bottom top";

export type SlideFrom = "left" | "right" | "up";

/** Откуда въезжает ячейка: крайние колонки — сбоку вдоль строки, средние и одна колонка — снизу */
export function slideFrom(cell: HTMLElement, grid: HTMLElement): SlideFrom {
  const override = cell.dataset.from;
  if (override === "left" || override === "right" || override === "up") return override;
  const first = cell.offsetLeft <= 1;
  const last = cell.offsetLeft + cell.offsetWidth >= grid.clientWidth - 1;
  if (first === last) return "up";
  return first ? "left" : "right";
}

/** Положение элемента внутри предка без учёта transform */
export function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left, top, width: el.offsetWidth, height: el.offsetHeight };
}
