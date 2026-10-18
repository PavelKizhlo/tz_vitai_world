"use client";

import { useEffect, useState } from "react";
import {
  DRIFT,
  EASE_OUT,
  EXIT_END,
  EXIT_START,
  SCRUB,
  SLIDE_X,
  SLIDE_Y,
  ScrollTrigger,
  SplitText,
  gsap,
  slideFrom,
  useGSAP,
} from "./gsap";
import { readMotionMode, useMotionMode } from "./motion";

/**
 * Все scroll-анимации страницы. Секции остаются серверными и только размечают себя:
 * data-grid — ряд-сетка: линии прорисовываются, ячейки въезжают вдоль них
 *   ("lines" — только линии, "intro" — сыграть при загрузке, а не по скроллу);
 * data-from — переопределить сторону въезда ячейки (left | right | up);
 * data-split — заголовок появляется по строкам ("intro" — при загрузке), data-split-by="words" — по словам;
 * data-parallax — скорость параллакса, доля от 1;
 * data-flip — грань-переворот в Wordmark.
 * Без анимаций (reduced motion, панель темы) ничего не создаётся — вёрстка остаётся статичной.
 */

let introPlayed = false;

type Segment = { axis: "x" | "y"; left: number; top: number; size: number };

function cellsOf(grid: HTMLElement) {
  return Array.from(grid.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && !el.classList.contains("grid-lines"),
  );
}

/**
 * Отрезки вокруг ячеек: над ячейкой (если не первая строка) и слева (между колонками или по
 * левому краю контейнера), а у последней колонки — справа по краю контейнера, если есть поле
 */
function segmentsOf(grid: HTMLElement, cells: HTMLElement[], ruled: boolean): Segment[] {
  const segments: Segment[] = [];
  const contentRight = grid.clientWidth - parseFloat(getComputedStyle(grid).paddingRight);
  for (const cell of cells) {
    const { offsetLeft: left, offsetTop: top, offsetWidth: width, offsetHeight: height } = cell;
    const right = left + width;
    const hasLeft = left > 1;
    const hasRight = right < grid.clientWidth - 1 && right >= contentRight - 1;
    // Горизонталь заходит на вертикали по бокам, чтобы на стыках не было дырок
    if (top > 1)
      segments.push({
        axis: "x",
        left: hasLeft ? left - 1 : left,
        top: top - 1,
        size: width + (hasLeft ? 1 : 0) + (hasRight ? 1 : 0),
      });
    if (hasLeft) segments.push({ axis: "y", left: left - 1, top, size: height });
    if (hasRight) segments.push({ axis: "y", left: right, top, size: height });
  }
  // Нижняя граница ряда: вместо border-bottom у контейнера появляется padding в толщину линии
  if (ruled)
    segments.push({ axis: "x", left: 0, top: grid.clientHeight - 1, size: grid.clientWidth });
  return segments;
}

function placeLine(line: HTMLElement, seg: Segment) {
  const horizontal = seg.axis === "x";
  Object.assign(line.style, {
    left: `${seg.left}px`,
    top: `${seg.top}px`,
    width: horizontal ? `${seg.size}px` : "var(--rule-width)",
    height: horizontal ? "var(--rule-width)" : `${seg.size}px`,
    transformOrigin: horizontal ? "left center" : "center top",
  });
}

function drawLines(grid: HTMLElement, cells: HTMLElement[]) {
  const ruled = parseFloat(getComputedStyle(grid).borderBottomWidth) > 0;
  grid.dataset.lines = ruled ? "ruled" : "";
  const overlay = document.createElement("div");
  overlay.className = "grid-lines";
  overlay.setAttribute("aria-hidden", "true");
  grid.append(overlay);

  // Геометрию обновляем на месте при каждом refresh: высота рядов меняется от шрифтов и формы
  const segments = segmentsOf(grid, cells, ruled);
  const lines = segments.map((seg) => {
    const line = document.createElement("span");
    placeLine(line, seg);
    overlay.append(line);
    return line;
  });

  const relayout = () => {
    const next = segmentsOf(grid, cells, ruled);
    if (next.length !== segments.length) return;
    next.forEach((seg, i) => {
      segments[i] = seg;
      placeLine(lines[i], seg);
    });
  };
  ScrollTrigger.addEventListener("refreshInit", relayout);

  return {
    segments,
    lines,
    cleanup() {
      ScrollTrigger.removeEventListener("refreshInit", relayout);
      overlay.remove();
      delete grid.dataset.lines;
    },
  };
}

export function ScrollScenes() {
  const mode = useMotionMode();
  const [build, setBuild] = useState(0);

  // Сменилась ширина — колонки могли перестроиться, собираем сцены заново.
  // Сменилась только высота (шрифты, ошибки формы, панель темы) — достаточно пересчитать триггеры
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    let width = main.offsetWidth;
    let timer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (Math.abs(main.offsetWidth - width) < 2) {
          ScrollTrigger.refresh();
          return;
        }
        width = main.offsetWidth;
        setBuild((n) => n + 1);
      }, 250);
    });
    observer.observe(main);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  useGSAP(
    () => {
      const root = document.documentElement;
      if (mode === "static") {
        // При гидрации хук ещё отдаёт серверное "static" — ждём рендера с настоящим режимом
        if (readMotionMode() !== "static") return;
        delete root.dataset.fxPending;
        return;
      }

      const cleanups: (() => void)[] = [];
      const intro = introPlayed ? null : gsap.timeline({ delay: 0.15 });
      introPlayed = true;

      for (const grid of gsap.utils.toArray<HTMLElement>("main [data-grid]")) {
        const kind = grid.dataset.grid;
        const cells = cellsOf(grid);
        const { segments, lines, cleanup } = drawLines(grid, cells);
        cleanups.push(cleanup);
        const isIntro = kind === "intro";

        lines.forEach((line, i) => {
          const seg = () => segments[i];
          const scale = seg().axis === "x" ? "scaleX" : "scaleY";
          if (isIntro) {
            if (intro)
              intro.fromTo(
                line,
                { [scale]: 0 },
                { [scale]: 1, duration: 1.1, ease: "power2.inOut" },
                i * 0.08,
              );
            return;
          }
          // Триггер — сам ряд со смещением отрезка: у ряда нет transform, замеры честные
          gsap.fromTo(
            line,
            { [scale]: 0 },
            {
              [scale]: 1,
              ease: "none",
              scrollTrigger: {
                trigger: grid,
                start: () => `top+=${seg().top} 95%`,
                end: () => {
                  const { axis, top, size } = seg();
                  return axis === "x" ? `top+=${top} 55%` : `top+=${top + size} 75%`;
                },
                scrub: SCRUB,
              },
            },
          );
        });

        if (kind === "lines") continue;

        const froms = cells.map((cell) => slideFrom(cell, grid));
        const columns = froms.some((from) => from !== "up");
        const tall = grid.offsetHeight >= window.innerHeight * 0.5;

        cells.forEach((cell, i) => {
          const from = froms[i];
          const offset =
            from === "up"
              ? { yPercent: SLIDE_Y }
              : { xPercent: from === "left" ? -SLIDE_X : SLIDE_X };

          if (isIntro) {
            if (intro)
              intro.from(
                cell,
                { ...offset, opacity: 0, duration: 1.2, ease: EASE_OUT },
                0.25 + i * 0.1,
              );
          } else {
            gsap.fromTo(
              cell,
              { ...offset, opacity: 0 },
              {
                xPercent: 0,
                yPercent: 0,
                opacity: 1,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: grid,
                  start: () => `top+=${cell.offsetTop} bottom`,
                  end: () => `top+=${cell.offsetTop} 45%`,
                  scrub: SCRUB,
                },
              },
            );
          }

          // Высокий ряд из нескольких колонок, уходя вверх, разъезжается обратно вдоль строки —
          // его «замещает» следующий
          if (!columns || !tall) return;
          gsap.fromTo(
            cell,
            { xPercent: 0, yPercent: 0 },
            {
              xPercent: from === "up" ? 0 : from === "left" ? -DRIFT : DRIFT,
              yPercent: from === "up" ? -DRIFT : 0,
              ease: "none",
              immediateRender: false,
              scrollTrigger: { trigger: grid, start: EXIT_START, end: EXIT_END, scrub: SCRUB },
            },
          );
        });
      }

      for (const el of gsap.utils.toArray<HTMLElement>("main [data-parallax]")) {
        const shift = (parseFloat(el.dataset.parallax ?? "") || 0.2) * 240;
        gsap.fromTo(
          el,
          { "--parallax": `${-shift}px` },
          {
            "--parallax": `${shift}px`,
            ease: "none",
            scrollTrigger: {
              trigger: el.closest<HTMLElement>("[data-grid]") ?? el.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      for (const el of gsap.utils.toArray<HTMLElement>("main [data-split]")) {
        const byWords = el.dataset.splitBy === "words";
        const isIntro = el.dataset.split === "intro";
        SplitText.create(el, {
          type: byWords ? "words" : "lines",
          mask: byWords ? "words" : "lines",
          autoSplit: true,
          onSplit(self) {
            const targets = byWords ? self.words : self.lines;
            if (isIntro) {
              // При повторных разбиениях (ресайз, шрифты) интро не переигрываем
              if (!intro) return;
              return gsap.from(targets, {
                yPercent: 110,
                duration: 1,
                stagger: 0.1,
                ease: EASE_OUT,
                delay: 0.45,
              });
            }
            return gsap.from(targets, {
              yPercent: 110,
              duration: 0.9,
              stagger: 0.12,
              ease: EASE_OUT,
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            });
          },
        });
      }

      const flips = gsap.utils.toArray<HTMLElement>("main [data-flip]");
      if (flips.length > 0) {
        gsap.fromTo(
          flips,
          { rotationY: 0 },
          {
            rotationY: 180,
            ease: "power1.inOut",
            stagger: 0.15,
            scrollTrigger: {
              trigger: flips[0].closest<HTMLElement>("[data-grid]") ?? flips[0],
              start: "top 90%",
              end: "bottom 40%",
              scrub: SCRUB,
            },
          },
        );
      }

      // Стартовые состояния интро уже выставлены — hero можно показывать
      delete root.dataset.fxPending;
      ScrollTrigger.refresh();

      return () => {
        // Интро прервали (StrictMode в dev, ресайз) — при следующей сборке сыграем его снова
        if (intro && intro.progress() < 1) introPlayed = false;
        cleanups.forEach((cleanup) => cleanup());
      };
    },
    { dependencies: [mode, build], revertOnUpdate: true },
  );

  return null;
}
