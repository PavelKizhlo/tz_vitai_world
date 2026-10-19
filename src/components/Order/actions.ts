"use server";

import { productOrder, type ProductId } from "@/data/catalog";
import { validate } from "./validation";

export type SubmitResult = { ok: true } | { ok: false; message: string };

const isProductId = (value: string): value is ProductId =>
  (productOrder as string[]).includes(value);

/**
 * Приём заявки. Форма уже всё проверила, но сервер проверяет заново теми же правилами.
 * Поле question приходит, только когда выбран вариант «Задать вопрос».
 */
export async function submitOrder(formData: FormData): Promise<SubmitResult> {
  const text = (key: string) => String(formData.get(key) ?? "");
  const asking = formData.has("question");
  const items = formData.getAll("items").map(String).filter(isProductId);
  // В поле телефон с маской «+375 29 123-45-67» — для проверки нужны цифры после 375
  const phone = text("phone").replace(/\D/g, "").replace(/^375/, "");

  const errors = validate({
    name: text("name"),
    phone,
    itemsCount: items.length,
    asking,
    question: text("question"),
  });
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Проверьте поля формы и отправьте ещё раз" };
  }

  // Сюда подключается доставка заявки (Telegram, CRM, почта): пока заявка только проверяется
  return { ok: true };
}
