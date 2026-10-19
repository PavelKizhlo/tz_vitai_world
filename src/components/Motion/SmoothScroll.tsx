"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useMotionMode } from "./motion";

/** Инерционная прокрутка колесом. На тач-устройствах и без анимаций остаётся нативная */
export function SmoothScroll() {
  const mode = useMotionMode();

  useEffect(() => {
    if (mode !== "follow") return;
    // anchors учитывает scroll-margin-top секций, так что якоря не прячутся под хедер
    const lenis = new Lenis({ anchors: true, allowNestedScroll: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [mode]);

  return null;
}
