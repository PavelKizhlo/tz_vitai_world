import { phoneError } from "./phone";

/**
 * Правила заявки — общие для формы и серверного действия, чтобы сервер не принял то,
 * что форма бы не пропустила.
 */

export type Errors = Partial<Record<"name" | "phone" | "items" | "question", string>>;

export type OrderFields = {
  name: string;
  /** Только цифры после +375 */
  phone: string;
  itemsCount: number;
  /** Поле вопроса видно и проверяется, только когда выбран вариант «Задать вопрос» */
  asking: boolean;
  question: string;
};

export const nameError = (name: string) =>
  name.trim() ? undefined : "Напишите, как к вам обращаться";

export function validate({ name, phone, itemsCount, asking, question }: OrderFields): Errors {
  const errors: Errors = {
    name: nameError(name),
    phone: phoneError(phone),
    items: itemsCount === 0 && !asking ? "Отметьте хотя бы одну позицию" : undefined,
    question: asking && !question.trim() ? "Напишите, что хотите спросить" : undefined,
  };
  // Пустые ключи убираем: по числу ключей решается, можно ли отправлять
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}
