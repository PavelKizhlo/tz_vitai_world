import { useEffect, useMemo, useSyncExternalStore } from "react";
import { UTM_KEYS, type UtmKey } from "./utmKeys";

/**
 * UTM-метки рекламного перехода для заявки. Берутся из адреса страницы, а если их там уже нет
 * (перезагрузили без параметров) — из sessionStorage, куда сохраняются при первом заходе.
 */

export { UTM_KEYS };
export type Utm = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = "kvarta:utm";
const MAX_LENGTH = 200;

/** Только UTM-параметры, в виде строки запроса — строка стабильна для useSyncExternalStore */
function pickUtm(search: string) {
  const source = new URLSearchParams(search);
  const picked = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = source.get(key)?.trim().slice(0, MAX_LENGTH);
    if (value) picked.set(key, value);
  }
  return picked.toString();
}

function readUtm() {
  const fromUrl = pickUtm(window.location.search);
  if (fromUrl) return fromUrl;
  try {
    return pickUtm(sessionStorage.getItem(STORAGE_KEY) ?? "");
  } catch {
    return "";
  }
}

// Адрес с метками не меняется, пока открыта страница, — подписываться не на что
const subscribe = () => () => {};

export function useUtm(): Utm {
  // На сервере и при гидрации меток нет, после гидрации подтягиваются из адреса
  const raw = useSyncExternalStore(subscribe, readUtm, () => "");

  useEffect(() => {
    if (!raw) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, raw);
    } catch {
      // Хранилище недоступно (приватный режим) — метки останутся только в адресе
    }
  }, [raw]);

  return useMemo(() => Object.fromEntries(new URLSearchParams(raw)), [raw]);
}
