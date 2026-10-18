"use client";

import { useRef } from "react";
import { Product3D } from "@/components/Product3D/Product3D";
import {
  DRIFT,
  EXIT_END,
  EXIT_START,
  SCRUB,
  ScrollTrigger,
  gsap,
  offsetWithin,
  slideFrom,
  useGSAP,
} from "./gsap";
import { useFlightEnabled } from "./motion";
import styles from "./FlightProduct.module.css";

type SlotId = "hero" | "catalog";

/**
 * Место пачки «Эфиопии» в hero и в каталоге. Когда перелёт включён, слот пустой и только
 * держит размер — модель рисует FlightLayer; иначе в каждом слоте своя модель.
 */
export function FlightSlot({ id, className }: { id: SlotId; className?: string }) {
  const enabled = useFlightEnabled();
  if (enabled) return <div data-flight-slot={id} className={className} aria-hidden="true" />;
  return <Product3D product="ethiopia" className={className} />;
}

function slot(id: SlotId) {
  return document.querySelector<HTMLElement>(`[data-flight-slot="${id}"]`);
}

/** Одна модель, которая при скролле уменьшается и переезжает из hero в карточку каталога */
export function FlightLayer() {
  const enabled = useFlightEnabled();
  const flyer = useRef<HTMLDivElement>(null);
  const drift = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const from = slot("hero");
      const to = slot("catalog");
      const el = flyer.current;
      const main = el?.offsetParent as HTMLElement | null;
      // Ячейка каталога, в которой лежит слот, и её ряд — их уход вверх повторяем
      const cell = to?.closest<HTMLElement>("[data-grid] > *");
      const row = cell?.parentElement;
      if (!from || !to || !el || !main || !cell || !row) return;

      let a = offsetWithin(from, main);
      let b = offsetWithin(to, main);
      const place = () => {
        a = offsetWithin(from, main);
        b = offsetWithin(to, main);
        gsap.set(el, { left: a.left, top: a.top, width: a.width, height: a.height });
      };
      place();
      ScrollTrigger.addEventListener("refreshInit", place);

      const header = () => document.querySelector("header")?.offsetHeight ?? 0;

      gsap.fromTo(
        el,
        { x: 0, y: 0, scale: 1 },
        {
          x: () => b.left - a.left,
          y: () => b.top - a.top,
          scale: () => b.width / a.width,
          ease: "power1.inOut",
          scrollTrigger: {
            start: 0,
            endTrigger: row,
            end: () => `top ${header()}px`,
            scrub: SCRUB,
            invalidateOnRefresh: true,
          },
        },
      );

      // Сдвиг внутри уменьшенного слоя, поэтому делим на масштаб
      const sign = slideFrom(cell, row) === "right" ? 1 : -1;
      gsap.fromTo(
        drift.current,
        { x: 0 },
        {
          x: () => (sign * DRIFT * cell.offsetWidth) / 100 / (b.width / a.width),
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: row,
            start: EXIT_START,
            end: EXIT_END,
            scrub: SCRUB,
            invalidateOnRefresh: true,
          },
        },
      );

      return () => ScrollTrigger.removeEventListener("refreshInit", place);
    },
    { dependencies: [enabled], revertOnUpdate: true },
  );

  if (!enabled) return null;
  return (
    <div ref={flyer} className={styles.flyer}>
      <div ref={drift} className={styles.drift}>
        <Product3D product="ethiopia" className={styles.product} />
      </div>
    </div>
  );
}
