/**
 * Очередь прогрева 3D-сцен. Сцены вне экрана создаются заранее, по одной и в простое браузера:
 * WebGL-контекст, компиляция шейдеров и загрузка текстуры успевают до того, как пользователь
 * доскроллит. Порядок — порядок регистрации, то есть порядок на странице.
 */
type Entry = {
  /** Запустить сцену; false — она уже запущена (например, приехала к экрану раньше очереди) */
  start: () => boolean;
};

const STALL_TIMEOUT = 4000;

const queue: Entry[] = [];
let current: Entry | null = null;
let scheduled = false;

function idle(callback: () => void) {
  // requestIdleCallback есть не во всех браузерах (старый Safari)
  if (typeof window.requestIdleCallback === "function")
    window.requestIdleCallback(callback, { timeout: 1200 });
  else setTimeout(callback, 200);
}

function pump() {
  if (current || scheduled || queue.length === 0) return;
  scheduled = true;
  idle(() => {
    scheduled = false;
    while (!current && queue.length > 0) {
      const entry = queue.shift()!;
      if (!entry.start()) continue;
      current = entry;
      // Если сцена так и не сообщила о готовности, очередь не должна встать
      window.setTimeout(() => warmupDone(entry), STALL_TIMEOUT);
    }
  });
}

/** Встать в очередь; возвращает отписку для размонтирования */
export function enqueueWarmup(entry: Entry) {
  queue.push(entry);
  pump();
  return () => {
    const index = queue.indexOf(entry);
    if (index !== -1) queue.splice(index, 1);
    if (current === entry) warmupDone(entry);
  };
}

/** Сцена готова — запускаем следующую */
export function warmupDone(entry: Entry) {
  if (current !== entry) return;
  current = null;
  pump();
}
