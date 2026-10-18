"use client";

import Image, { type StaticImageData } from "next/image";
import { useId, useState, type FormEvent } from "react";
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
import { useOrder } from "./OrderContext";
import styles from "./Order.module.css";

type Errors = Partial<Record<"name" | "phone" | "items", string>>;

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

function validate(name: string, phone: string, itemsCount: number): Errors {
  const errors: Errors = {};
  if (!name.trim()) errors.name = "Напишите, как к вам обращаться";
  if (phone.replace(/\D/g, "").length < 9) errors.phone = "Проверьте номер телефона";
  if (itemsCount === 0) errors.items = "Отметьте хотя бы одну позицию";
  return errors;
}

export function OrderForm() {
  const id = useId();
  const { picked, toggle, clear } = useOrder();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [way, setWay] = useState<DeliveryWay>("delivery");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(name, phone, picked.size);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    // Отправка заявки на сервер подключается здесь
    setSent(true);
  };

  const reset = () => {
    setSent(false);
    setName("");
    setPhone("");
    setWay("delivery");
    setErrors({});
    clear();
  };

  if (sent) {
    return (
      <div role="status" className={styles.success}>
        <div className={styles.successText}>
          <p className={styles.successTitle}>
            <span className="heavy">Спасибо,</span> заявка у нас
          </p>
          <p>Скоро позвоним, чтобы всё уточнить.</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className={buttonClass({ variant: "line", size: "lg", className: styles.again })}
        >
          Отправить ещё одну
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
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
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+375 __ ___-__-__"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
            className={styles.input}
          />
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
                onClick={() => toggle(productId)}
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
        </div>
        {errors.items && (
          <span id={`${id}-items-error`} className={styles.error}>
            {errors.items}
          </span>
        )}
      </fieldset>

      <fieldset className={styles.fieldset}>
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

      <button type="submit" className={buttonClass({ variant: "primary", size: "lg" })}>
        Отправить заявку
      </button>
    </form>
  );
}
