"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import {
  GROUPS,
  applyTheme,
  copyText,
  ensureGoogleFont,
  formatCss,
  nudgeNumber,
  readRootTokens,
  resolveValue,
  themeStore,
  toHex,
  type GroupId,
  type Token,
} from "./themeTokens";
import styles from "./ThemePanel.module.css";

/**
 * Панель для экспериментов с темой: правит CSS-переменные на лету
 * и копирует результат готовым блоком :root.
 * Стили панели не зависят от токенов страницы, чтобы правки её не ломали.
 */
export function ThemePanel() {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [group, setGroup] = useState<GroupId>("color");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<"changed" | "all" | null>(null);
  const applied = useRef<Record<string, string>>({});

  useEffect(() => {
    applyTheme(theme, applied.current);
    applied.current = theme.overrides;
  }, [theme]);

  // Шрифты подгружаем с задержкой, чтобы не дёргать Google на каждую букву
  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const [name, value] of Object.entries(theme.overrides)) {
        if (name.startsWith("--font-")) ensureGoogleFont(value);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [theme.overrides]);

  const defaults = useMemo(
    () => Object.fromEntries(tokens.map((t) => [t.name, t.value])),
    [tokens],
  );
  const values = useMemo(() => ({ ...defaults, ...theme.overrides }), [defaults, theme.overrides]);
  const changedCount = Object.keys(theme.overrides).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q)
      return tokens.filter((t) => t.name.includes(q) || values[t.name]?.toLowerCase().includes(q));
    return tokens.filter((t) => t.group === group);
  }, [tokens, group, query, values]);

  const openPanel = () => {
    if (tokens.length === 0) setTokens(readRootTokens());
    setOpen(true);
  };

  const setValue = (name: string, value: string) => {
    const overrides = { ...theme.overrides };
    if (value === defaults[name]) delete overrides[name];
    else overrides[name] = value;
    themeStore.set({ ...theme, overrides });
  };

  const resetAll = () => {
    if (changedCount > 0 && !window.confirm("Сбросить все изменения темы?")) return;
    themeStore.set({ overrides: {}, motion: true });
  };

  const copy = async (onlyChanged: boolean) => {
    const ok = await copyText(formatCss(tokens, theme.overrides, onlyChanged));
    if (!ok) return;
    setCopied(onlyChanged ? "changed" : "all");
    window.setTimeout(() => setCopied(null), 1800);
  };

  if (!open) {
    return (
      <button type="button" className={styles.toggle} onClick={openPanel} aria-expanded={false}>
        <PaletteIcon />
        Тема
        {changedCount > 0 && <span className={styles.toggleCount}>{changedCount}</span>}
      </button>
    );
  }

  return (
    <section
      className={styles.panel}
      aria-label="Настройка токенов темы"
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <header className={styles.head}>
        <div className={styles.headTitle}>
          <strong>Токены темы</strong>
          <span className={styles.muted}>
            изменено {changedCount} из {tokens.length}
          </span>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setOpen(false)}
          aria-label="Свернуть панель"
        >
          <CloseIcon />
        </button>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder="Поиск: navy, space, 16px…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Поиск токена"
        />
        <div className={styles.tabs} role="tablist" aria-label="Группы токенов">
          {GROUPS.map((g) => {
            const total = tokens.filter((t) => t.group === g.id).length;
            if (total === 0) return null;
            const changed = tokens.filter(
              (t) => t.group === g.id && t.name in theme.overrides,
            ).length;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={!query && group === g.id}
                className={styles.tab}
                onClick={() => {
                  setGroup(g.id);
                  setQuery("");
                }}
              >
                {g.label}
                {changed > 0 && (
                  <span className={styles.tabDot} aria-label={`изменено ${changed}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ul className={styles.list}>
        {visible.map((token) => (
          <TokenRow
            key={token.name}
            token={token}
            value={values[token.name] ?? ""}
            resolved={resolveValue(token.name, values)}
            changed={token.name in theme.overrides}
            onChange={(v) => setValue(token.name, v)}
          />
        ))}
        {visible.length === 0 && <li className={styles.empty}>Ничего не найдено</li>}
      </ul>

      <footer className={styles.foot}>
        <p className={styles.hint}>↑/↓ в поле меняют число под курсором, Shift — шаг ×10</p>
        <div className={styles.actions}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={theme.motion}
              onChange={(e) => themeStore.set({ ...theme, motion: e.target.checked })}
            />
            Анимации
          </label>
          <button type="button" className={styles.ghost} onClick={resetAll}>
            Сбросить
          </button>
          <button type="button" className={styles.ghost} onClick={() => copy(false)}>
            {copied === "all" ? "Скопировано" : "Копировать все"}
          </button>
          <button type="button" className={styles.primary} onClick={() => copy(true)}>
            {copied === "changed" ? "Скопировано" : `Копировать изменения (${changedCount})`}
          </button>
        </div>
      </footer>
    </section>
  );
}

type TokenRowProps = {
  token: Token;
  value: string;
  resolved: string;
  changed: boolean;
  onChange: (value: string) => void;
};

function TokenRow({ token, value, resolved, changed, onChange }: TokenRowProps) {
  const isColor = token.group === "color";
  const hex = isColor ? toHex(resolved) : null;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const input = e.currentTarget;
    const result = nudgeNumber(
      value,
      input.selectionStart ?? 0,
      e.key === "ArrowUp" ? 1 : -1,
      e.shiftKey,
    );
    if (!result) return;
    e.preventDefault();
    onChange(result.value);
    requestAnimationFrame(() => input.setSelectionRange(result.caret, result.caret));
  };

  return (
    <li className={styles.row} data-changed={changed || undefined}>
      <span className={styles.name} title={token.name}>
        {token.name.replace(/^--/, "")}
      </span>
      <span className={styles.control}>
        {isColor && (
          <label className={styles.swatch} style={{ background: `var(${token.name})` }}>
            <input
              type="color"
              value={hex ?? "#000000"}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`Выбрать цвет ${token.name}`}
            />
          </label>
        )}
        <input
          className={styles.value}
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={token.name}
        />
        <button
          type="button"
          className={styles.reset}
          onClick={() => onChange(token.value)}
          disabled={!changed}
          aria-label={`Вернуть ${token.name} к ${token.value}`}
          title={changed ? `Было: ${token.value}` : undefined}
        >
          <ResetIcon />
        </button>
      </span>
    </li>
  );
}

function PaletteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.7-1.3-.7-2.1 0-.9.7-1.6 1.6-1.6h1.9A4.6 4.6 0 0 0 21 11 8.4 8.4 0 0 0 12 3Z" />
      <circle cx="7.5" cy="11" r="1.2" />
      <circle cx="10.5" cy="7" r="1.2" />
      <circle cx="15" cy="7.5" r="1.2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" />
    </svg>
  );
}
