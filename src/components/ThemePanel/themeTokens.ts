/*
 * Логика панели темы: находит токены на :root, хранит правки в localStorage,
 * применяет их inline-стилями на <html> и собирает CSS для копирования.
 */

export type GroupId = "color" | "font" | "type" | "space" | "shape" | "layout" | "motion" | "other";

export type Token = {
  name: string;
  value: string;
  group: GroupId;
};

export type ThemeState = {
  overrides: Record<string, string>;
  motion: boolean;
};

export const GROUPS: { id: GroupId; label: string; prefixes: string[] }[] = [
  { id: "color", label: "Цвета", prefixes: ["--color-"] },
  { id: "font", label: "Шрифты", prefixes: ["--font-", "--fw-"] },
  { id: "type", label: "Текст", prefixes: ["--fs-", "--lh-", "--tracking-"] },
  { id: "space", label: "Отступы", prefixes: ["--space-"] },
  { id: "shape", label: "Формы", prefixes: ["--radius-", "--rule-", "--shadow-", "--control-"] },
  { id: "layout", label: "Блоки", prefixes: ["--layout-", "--deco-"] },
  { id: "motion", label: "Анимация", prefixes: ["--motion-"] },
  { id: "other", label: "Прочее", prefixes: [] },
];

function groupOf(name: string): GroupId {
  return GROUPS.find((g) => g.prefixes.some((p) => name.startsWith(p)))?.id ?? "other";
}

/** Собирает переменные из правил `:root` всех стилей страницы в порядке объявления */
export function readRootTokens(): Token[] {
  const found = new Map<string, string>();

  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        if (rule.selectorText.trim() !== ":root") continue;
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith("--")) found.set(prop, rule.style.getPropertyValue(prop).trim());
        }
      } else if (
        (typeof CSSLayerBlockRule !== "undefined" && rule instanceof CSSLayerBlockRule) ||
        rule instanceof CSSSupportsRule
      ) {
        walk(rule.cssRules);
      }
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      // Стили с другого домена недоступны для чтения — пропускаем
    }
  }

  return Array.from(found, ([name, value]) => ({ name, value, group: groupOf(name) }));
}

/* ---------- Хранилище ---------- */

const STORAGE_KEY = "kvarta-theme-v1";
const SERVER_STATE: ThemeState = { overrides: {}, motion: true };

let state: ThemeState | null = null;
const listeners = new Set<() => void>();

function load(): ThemeState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ThemeState>;
      return { overrides: parsed.overrides ?? {}, motion: parsed.motion ?? true };
    }
  } catch {
    // Хранилище недоступно (приватный режим и т. п.) — работаем без сохранения
  }
  return SERVER_STATE;
}

export const themeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): ThemeState {
    if (!state) state = load();
    return state;
  },
  getServerSnapshot(): ThemeState {
    return SERVER_STATE;
  },
  set(next: ThemeState) {
    state = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // см. load()
    }
    listeners.forEach((l) => l());
  },
};

/** Переносит состояние на <html>: inline-переменные и флаг анимаций */
export function applyTheme(next: ThemeState, previous: Record<string, string>) {
  const root = document.documentElement;
  for (const name of Object.keys(previous)) {
    if (!(name in next.overrides)) root.style.removeProperty(name);
  }
  for (const [name, value] of Object.entries(next.overrides)) {
    root.style.setProperty(name, value);
  }
  if (next.motion) root.removeAttribute("data-motion");
  else root.setAttribute("data-motion", "off");
}

/* ---------- Цвета ---------- */

let colorCtx: CanvasRenderingContext2D | null = null;

/** Приводит любой CSS-цвет к #rrggbb для <input type="color">; null — если цвет не распознан */
export function toHex(value: string): string | null {
  if (typeof document === "undefined") return null;
  colorCtx ??= document.createElement("canvas").getContext("2d");
  if (!colorCtx) return null;
  colorCtx.fillStyle = "#010203";
  colorCtx.fillStyle = value;
  const result = colorCtx.fillStyle;
  if (result === "#010203" && value.trim().toLowerCase() !== "#010203") return null;
  return /^#[0-9a-f]{6}$/i.test(result) ? result : null;
}

/** Раскрывает цепочку `var(--x)` по текущим значениям токенов */
export function resolveValue(name: string, values: Record<string, string>, depth = 0): string {
  const value = values[name] ?? "";
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  if (ref && depth < 8) return resolveValue(ref[1], values, depth + 1);
  return value;
}

/* ---------- Шаг числа стрелками ---------- */

/** Меняет число под курсором на ±шаг: 1 для целых, 0.1/0.01 для дробей; Shift — ×10 */
export function nudgeNumber(value: string, caret: number, direction: 1 | -1, big: boolean) {
  const matches = Array.from(value.matchAll(/-?\d*\.?\d+/g));
  if (matches.length === 0) return null;

  const target =
    matches.find((m) => caret >= m.index && caret <= m.index + m[0].length) ??
    matches.reduce((best, m) =>
      Math.abs(m.index - caret) < Math.abs(best.index - caret) ? m : best,
    );

  const decimals = target[0].split(".")[1]?.length ?? 0;
  const step = 10 ** -decimals * (big ? 10 : 1);
  const next = (parseFloat(target[0]) + direction * step).toFixed(decimals);
  const start = target.index;

  return {
    value: value.slice(0, start) + next + value.slice(start + target[0].length),
    caret: start + next.length,
  };
}

/* ---------- Шрифты ---------- */

const GENERIC_FONTS = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "-apple-system",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
]);

const requestedFonts = new Set<string>();
const WEIGHT_VARIANTS = [
  ":wght@100..900",
  ":wght@200..900",
  ":wght@300..900",
  ":wght@400..900",
  ":wght@400;700",
  "",
];

/** Подгружает с Google Fonts первое семейство из значения font-family, если его ещё нет */
export function ensureGoogleFont(value: string) {
  const first = value
    .split(",")[0]
    ?.trim()
    .replace(/^["']|["']$/g, "");
  if (!first || first.startsWith("var(") || GENERIC_FONTS.has(first.toLowerCase())) return;
  if (requestedFonts.has(first)) return;
  requestedFonts.add(first);

  const family = encodeURIComponent(first).replace(/%20/g, "+");
  const tryVariant = (index: number) => {
    if (index >= WEIGHT_VARIANTS.length) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${family}${WEIGHT_VARIANTS[index]}&display=swap`;
    link.dataset.themePanelFont = first;
    // Google отвечает 400, если у шрифта нет такого диапазона насыщенности — пробуем следующий
    link.onerror = () => {
      link.remove();
      tryVariant(index + 1);
    };
    document.head.appendChild(link);
  };
  tryVariant(0);
}

/* ---------- Экспорт ---------- */

export function formatCss(
  tokens: Token[],
  overrides: Record<string, string>,
  onlyChanged: boolean,
) {
  const changed = tokens.filter((t) => t.name in overrides && overrides[t.name] !== t.value);
  const list = onlyChanged ? changed : tokens;
  const blocks = GROUPS.flatMap((group) => {
    const items = list.filter((t) => t.group === group.id);
    if (items.length === 0) return [];
    const lines = items.map((t) => {
      const isChanged = t.name in overrides && overrides[t.name] !== t.value;
      const note = isChanged ? ` /* было: ${t.value} */` : "";
      return `  ${t.name}: ${overrides[t.name] ?? t.value};${note}`;
    });
    return [[`  /* ${group.label} */`, ...lines].join("\n")];
  });

  return [
    `/* Кварта · токены темы: изменено ${changed.length} из ${tokens.length} */`,
    ":root {",
    blocks.join("\n\n"),
    "}",
  ].join("\n");
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
