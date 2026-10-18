import { useSyncExternalStore } from "react";

/**
 * static — модель стоит неподвижно (reduced motion или анимации выключены в панели темы);
 * bob — только покачивание (тач-устройства);
 * follow — покачивание и поворот за курсором (десктоп).
 */
export type MotionMode = "static" | "bob" | "follow";

const REDUCED = "(prefers-reduced-motion: reduce)";
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(REDUCED), window.matchMedia(FINE_POINTER)];
  queries.forEach((q) => q.addEventListener("change", onChange));
  // Панель темы выключает анимации атрибутом data-motion="off" на <html>
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  return () => {
    queries.forEach((q) => q.removeEventListener("change", onChange));
    observer.disconnect();
  };
}

/** Текущий режим без подписки — для эффектов, которым нельзя ждать гидрации хука */
export function readMotionMode(): MotionMode {
  const motionOff =
    window.matchMedia(REDUCED).matches || document.documentElement.dataset.motion === "off";
  if (motionOff) return "static";
  return window.matchMedia(FINE_POINTER).matches ? "follow" : "bob";
}

export function useMotionMode() {
  return useSyncExternalStore(subscribe, readMotionMode, () => "static" as const);
}

const WIDE = "(min-width: 768px)";

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Перелёт модели из hero в каталог: только с анимациями и на планшете/десктопе */
export function useFlightEnabled() {
  const mode = useMotionMode();
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
  return mode !== "static" && wide;
}

/** Последняя позиция курсора в окне; один слушатель на все сцены */
export const pointer = { x: 0, y: 0, active: false };

let pointerUsers = 0;

function onPointerMove(e: PointerEvent) {
  if (e.pointerType !== "mouse") return;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
}

function onPointerLeave() {
  pointer.active = false;
}

export function trackPointer() {
  if (pointerUsers++ === 0) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
  }
  return () => {
    if (--pointerUsers === 0) {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      pointer.active = false;
    }
  };
}
