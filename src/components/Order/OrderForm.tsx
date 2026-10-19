"use client";

import Image, { type StaticImageData } from "next/image";
import { useId, useState, type ChangeEvent, type FormEvent, type SyntheticEvent } from "react";
import { flushSync } from "react-dom";
import {
  deliveryWays,
  productOrder,
  products,
  type DeliveryWay,
  type ProductId,
} from "@/data/catalog";
import { buttonClass } from "@/components/ui/button";
import { cx } from "@/components/ui";
import brazilThumb from "../../../public/thumbs/brazil.webp";
import colombiaThumb from "../../../public/thumbs/colombia.webp";
import dripThumb from "../../../public/thumbs/drip.webp";
import ethiopiaThumb from "../../../public/thumbs/ethiopia.webp";
import { submitOrder } from "./actions";
import { useOrder } from "./OrderContext";
import {
  PHONE_CODE_ERROR,
  PHONE_PREFIX,
  PHONE_TEMPLATE,
  formatPhone,
  editPhone,
  phoneCodeError,
  phoneCaretPosition,
} from "./phone";
import { UTM_KEYS, useUtm } from "./utm";
import { nameError, validate, type Errors } from "./validation";
import styles from "./Order.module.css";

/**
 * Плоские превью из npm run build:3d; подписка — две пачки в месяц.
 * Импорт, а не путь из public: в URL попадает хэш файла, и после пересборки превью
 * ни оптимизатор картинок, ни браузер не покажут старую версию.
 */
const THUMBS: Record<ProductId, StaticImageData[]> = {
  ethiopia: [ethiopiaThumb],
  colombia: [colombiaThumb],
  brazil: [brazilThumb],
  drip: [dripThumb],
  subscription: [colombiaThumb, brazilThumb],
};

/** Уведомление над кнопкой отправки: зелёное — успех, красное — ошибка */
type Notice = { kind: "success" | "error"; text: string };

const SEND_FAILED = "Не получилось отправить заявку. Попробуйте ещё раз чуть позже";

export function OrderForm() {
  const id = useId();
  const { picked, asking, toggle, toggleAsking, clear } = useOrder();
  const utm = useUtm();
  const [name, setName] = useState("");
  // Только цифры после +375, в поле показывается formatPhone(phone)
  const [phone, setPhone] = useState("");
  const [way, setWay] = useState<DeliveryWay>("delivery");
  const [question, setQuestion] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const nextErrors = validate({ name, phone, itemsCount: picked.size, asking, question });
    setErrors(nextErrors);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0) return;

    // Товары, способ получения, вопрос и UTM-метки уже лежат в полях формы
    const formData = new FormData(event.currentTarget);
    const wasAsking = asking;
    setSending(true);
    try {
      const result = await submitOrder(formData);
      if (!result.ok) {
        setNotice({ kind: "error", text: result.message });
        return;
      }
      reset();
      setNotice({
        kind: "success",
        text: wasAsking
          ? "Спасибо за вопрос! Скоро ответим"
          : "Спасибо, заявка у нас! Скоро позвоним, чтобы всё уточнить",
      });
    } catch {
      setNotice({ kind: "error", text: SEND_FAILED });
    } finally {
      setSending(false);
    }
  };

  const changePhone = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const { inputType = "" } = event.nativeEvent as InputEvent;
    const caret = input.selectionStart ?? input.value.length;
    const { local, digitsBeforeCaret } = editPhone(input.value, caret, inputType, phone);
    // Неверный код оператора подсвечиваем сразу, остальные ошибки телефона — при отправке
    const codeError = phoneCodeError(local);

    // Перерисовываем синхронно, чтобы поставить каретку уже в отформатированное значение
    flushSync(() => {
      setPhone(local);
      setErrors((prev) => ({
        ...prev,
        phone: codeError ?? (prev.phone === PHONE_CODE_ERROR ? undefined : prev.phone),
      }));
    });
    // Если цифры не изменились, React не перерисует поле — значение возвращаем сами
    const formatted = formatPhone(local);
    if (input.value !== formatted) input.value = formatted;
    const position = phoneCaretPosition(local, digitsBeforeCaret);
    if (document.activeElement === input) input.setSelectionRange(position, position);
  };

  // Каретка не заходит внутрь +375, чтобы префикс нельзя было стереть или дописать
  const keepCaretAfterPrefix = (event: SyntheticEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;
    if (start >= PHONE_PREFIX.length) return;
    const end = Math.max(input.selectionEnd ?? 0, PHONE_PREFIX.length);
    input.setSelectionRange(PHONE_PREFIX.length, end);
  };

  const phoneValue = formatPhone(phone);

  // Любой выбор варианта снимает ошибки выбора и вопроса — поле вопроса могло исчезнуть
  const pick = (select: () => void) => {
    select();
    setErrors((prev) => ({ ...prev, items: undefined, question: undefined }));
  };

  const reset = () => {
    setName("");
    setPhone("");
    setWay("delivery");
    setQuestion("");
    setErrors({});
    clear();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      {/* Источник перехода из рекламы: скрытые поля, пустые метки не отправляются */}
      {UTM_KEYS.map(
        (key) => utm[key] && <input key={key} type="hidden" name={key} value={utm[key]} />,
      )}
      {/* Варианты выбираются кнопками — для отправки дублируем выбор скрытыми полями */}
      {[...picked].map((productId) => (
        <input key={productId} type="hidden" name="items" value={productId} />
      ))}
      {!asking && <input type="hidden" name="delivery" value={way} />}
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor={`${id}-name`} className={styles.label}>
            Имя
          </label>
          <input
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Как к вам обращаться"
            value={name}
            onChange={(e) => setName(e.target.value)}
            // Имя проверяется, как только пользователь ушёл из поля, а не только при отправке
            onBlur={() => setErrors((prev) => ({ ...prev, name: nameError(name) }))}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
            className={styles.input}
          />
          {errors.name && (
            <span id={`${id}-name-error`} className={styles.error}>
              {errors.name}
            </span>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-phone`} className={styles.label}>
            Телефон
          </label>
          <div className={styles.phone}>
            {/* Невведённая часть шаблона под полем: введённое скрыто, видны только «_» */}
            <span className={styles.phoneMask} aria-hidden="true">
              <span className={styles.phoneTyped}>{phoneValue}</span>
              {PHONE_TEMPLATE.slice(phoneValue.length)}
            </span>
            <input
              id={`${id}-phone`}
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phoneValue}
              onChange={changePhone}
              onSelect={keepCaretAfterPrefix}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
              className={styles.input}
            />
          </div>
          {errors.phone && (
            <span id={`${id}-phone-error`} className={styles.error}>
              {errors.phone}
            </span>
          )}
        </div>
      </div>

      <fieldset
        className={styles.fieldset}
        aria-describedby={errors.items ? `${id}-items-error` : undefined}
      >
        <legend className={styles.label}>Что хотите</legend>
        <div className={styles.chips}>
          {productOrder.map((productId) => {
            const on = picked.has(productId);
            return (
              <button
                key={productId}
                type="button"
                aria-pressed={on}
                onClick={() => pick(() => toggle(productId))}
                className={cx(styles.chip, styles.chipProduct, on && styles.chipOn)}
              >
                <span className={styles.thumbs} aria-hidden="true">
                  {THUMBS[productId].map((thumb) => (
                    <Image
                      key={thumb.src}
                      src={thumb}
                      alt=""
                      sizes="140px"
                      className={styles.thumb}
                    />
                  ))}
                </span>
                {products[productId].name}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={asking}
            onClick={() => pick(toggleAsking)}
            className={cx(styles.chip, styles.chipProduct, asking && styles.chipOn)}
          >
            <span className={cx(styles.thumbs, styles.chipQuestion)} aria-hidden="true">
              ?
            </span>
            Задать вопрос
          </button>
        </div>
        {errors.items && (
          <span id={`${id}-items-error`} className={styles.error}>
            {errors.items}
          </span>
        )}
      </fieldset>

      {/* Поле вопроса ложится поверх скрытых способов получения: высоту ряда задают они, она не прыгает */}
      <div className={styles.swap}>
        <fieldset inert={asking} className={cx(styles.fieldset, asking && styles.concealed)}>
          <legend className={styles.label}>Как получить</legend>
          <div className={styles.chips}>
            {deliveryWays.map((option) => {
              const on = way === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setWay(option.id)}
                  className={cx(styles.chip, on && styles.chipOn)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {asking && (
          <div className={cx(styles.field, styles.questionField)}>
            <label htmlFor={`${id}-question`} className={styles.label}>
              Есть вопрос?
            </label>
            <textarea
              id={`${id}-question`}
              name="question"
              maxLength={1000}
              placeholder="Про зерно, помол, доставку — спрашивайте"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              aria-invalid={!!errors.question}
              aria-describedby={errors.question ? `${id}-question-error` : undefined}
              className={cx(styles.input, styles.textarea)}
            />
            {errors.question && (
              <span id={`${id}-question-error`} className={styles.error}>
                {errors.question}
              </span>
            )}
          </div>
        )}
      </div>

      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={cx(
            styles.notice,
            notice.kind === "error" ? styles.noticeError : styles.noticeSuccess,
          )}
        >
          {notice.text}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className={buttonClass({
          variant: "primary",
          size: "lg",
          className: cx(styles.submit, sending && styles.submitting),
        })}
      >
        {sending ? "Отправляем…" : "Отправить заявку"}
        {sending && <span className={styles.spinner} aria-hidden="true" />}
      </button>
    </form>
  );
}
