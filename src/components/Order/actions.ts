"use server";

import { deliveryWays, productOrder, products, type ProductId } from "@/data/catalog";
import { formatPhone } from "./phone";
import { UTM_KEYS } from "./utmKeys";
import { validate } from "./validation";

/** Текст ошибки подбирает форма: invalid — поля не прошли проверку, failed — Telegram не принял */
export type SubmitResult = { ok: true } | { ok: false; reason: "invalid" | "failed" };

const isProductId = (value: string): value is ProductId =>
  (productOrder as string[]).includes(value);

// Для parse_mode: "HTML" Telegram требует экранировать только эти три символа
const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/** Текст сообщения для чата: заголовок, контакты, выбор и метки рекламы, если есть */
function composeMessage(formData: FormData, local: string, items: ProductId[]) {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const question = text("question");
  const way = deliveryWays.find((option) => option.id === text("delivery"));
  const utm = UTM_KEYS.filter((key) => text(key)).map((key) => `${key}=${text(key)}`);

  const lines = [
    `<b>${formData.has("question") ? "Вопрос с сайта" : "Новая заявка"}</b>`,
    "",
    `Имя: ${escapeHtml(text("name").slice(0, 100))}`,
    `Телефон: ${formatPhone(local)}`,
  ];
  if (items.length > 0) lines.push(`Что хотят: ${items.map((id) => products[id].name).join(", ")}`);
  if (way) lines.push(`Как получить: ${way.label}`);
  if (question) lines.push("", "Вопрос:", escapeHtml(question.slice(0, 1000)));
  if (utm.length > 0) lines.push("", `<i>${escapeHtml(utm.join(" · "))}</i>`);
  return lines.join("\n");
}

async function sendToTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("Заявка не отправлена: не заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID");
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return true;
    // В лог — только ответ Telegram, без данных клиента
    const { description } = (await response.json().catch(() => ({}))) as { description?: string };
    console.error(`Telegram отклонил заявку: ${response.status} ${description ?? ""}`);
  } catch (error) {
    console.error("Telegram недоступен:", error instanceof Error ? error.message : error);
  }
  return false;
}

/**
 * Приём заявки: проверка теми же правилами, что и в форме, затем сообщение в Telegram.
 * Поле question приходит, только когда выбран вариант «Задать вопрос».
 */
export async function submitOrder(formData: FormData): Promise<SubmitResult> {
  const items = formData.getAll("items").map(String).filter(isProductId);
  // В поле телефон с маской «+375 29 123-45-67» — для проверки нужны цифры после 375
  const local = String(formData.get("phone") ?? "")
    .replace(/\D/g, "")
    .replace(/^375/, "");

  const errors = validate({
    name: String(formData.get("name") ?? ""),
    phone: local,
    itemsCount: items.length,
    asking: formData.has("question"),
    question: String(formData.get("question") ?? ""),
  });
  if (Object.keys(errors).length > 0) {
    return { ok: false, reason: "invalid" };
  }

  const sent = await sendToTelegram(composeMessage(formData, local, items));
  return sent ? { ok: true } : { ok: false, reason: "failed" };
}
