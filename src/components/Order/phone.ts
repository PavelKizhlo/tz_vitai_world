/**
 * Телефон в форме заявки: префикс +375 зашит в поле и не стирается, в состоянии хранятся
 * только 9 цифр после него — код оператора и номер.
 */

export const PHONE_PREFIX = "+375 ";
/** Шаблон под введёнными цифрами: показывает, сколько ещё вводить */
export const PHONE_TEMPLATE = "+375 __ ___-__-__";

const LOCAL_LENGTH = 9;
const OPERATOR_CODES = ["25", "29", "33", "44"];

export const PHONE_CODE_ERROR = "Введите корректный код";
export const PHONE_LENGTH_ERROR = "Проверьте номер телефона";

/** Цифры после +375 → «+375 29 123-45-67» (частично введённый номер — по тому же шаблону) */
export function formatPhone(local: string) {
  const parts = [
    local.slice(0, 2),
    local.slice(2, 5) && ` ${local.slice(2, 5)}`,
    local.slice(5, 7) && `-${local.slice(5, 7)}`,
    local.slice(7, 9) && `-${local.slice(7, 9)}`,
  ];
  return PHONE_PREFIX + parts.join("");
}

/**
 * Новое значение поля → цифры после +375.
 * Если префикс повреждён удалением — правка отменяется. Если значение вставлено целиком
 * (автозаполнение, буфер) — отрезается 375 или белорусская восьмёрка 80.
 */
function parsePhone(raw: string, prevLocal: string) {
  let digits: string;
  if (raw.startsWith(PHONE_PREFIX)) {
    digits = raw.slice(PHONE_PREFIX.length).replace(/\D/g, "");
  } else if (raw.length < formatPhone(prevLocal).length) {
    return prevLocal;
  } else {
    digits = raw.replace(/\D/g, "").replace(/^(375|80)/, "");
  }
  return digits.slice(0, LOCAL_LENGTH);
}

const countDigits = (text: string) => text.replace(/\D/g, "").length;

/**
 * Правка поля с учётом каретки. Возвращает цифры после +375 и сколько из них стоит
 * перед кареткой — по этому числу каретка возвращается на место после переформатирования.
 * Стирание пробела или дефиса стирает соседнюю цифру, иначе маска вернула бы разделитель.
 */
export function editPhone(raw: string, caret: number, inputType: string, prevLocal: string) {
  const local = parsePhone(raw, prevLocal);
  if (!raw.startsWith(PHONE_PREFIX)) {
    // Стёрли пробел префикса — правка отменена, каретка остаётся сразу за +375;
    // значение заменено целиком (вставка, автозаполнение) — каретка в конец
    const prefixHit = local === prevLocal && raw.length < formatPhone(prevLocal).length;
    return { local, digitsBeforeCaret: prefixHit ? 0 : local.length };
  }

  const digitsBeforeCaret = Math.min(
    countDigits(raw.slice(PHONE_PREFIX.length, Math.max(caret, PHONE_PREFIX.length))),
    local.length,
  );
  const removedSeparator = local === prevLocal && raw.length < formatPhone(prevLocal).length;
  if (removedSeparator && inputType === "deleteContentBackward" && digitsBeforeCaret > 0) {
    const at = digitsBeforeCaret - 1;
    return { local: local.slice(0, at) + local.slice(at + 1), digitsBeforeCaret: at };
  }
  if (removedSeparator && inputType === "deleteContentForward") {
    const at = digitsBeforeCaret;
    return { local: local.slice(0, at) + local.slice(at + 1), digitsBeforeCaret: at };
  }
  return { local, digitsBeforeCaret };
}

/** Позиция каретки в отформатированном номере сразу после n-й цифры после +375 */
export function phoneCaretPosition(local: string, digitsBeforeCaret: number) {
  const formatted = formatPhone(local);
  let seen = 0;
  for (let i = PHONE_PREFIX.length; i < formatted.length; i++) {
    if (seen === digitsBeforeCaret) return i;
    if (/\d/.test(formatted[i])) seen++;
  }
  return formatted.length;
}

/** Неверный код показывается сразу после второй цифры, длина — при отправке */
export function phoneCodeError(local: string) {
  return local.length >= 2 && !OPERATOR_CODES.includes(local.slice(0, 2))
    ? PHONE_CODE_ERROR
    : undefined;
}

export function phoneError(local: string) {
  return phoneCodeError(local) ?? (local.length < LOCAL_LENGTH ? PHONE_LENGTH_ERROR : undefined);
}
