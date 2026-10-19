/** Общие данные сайта для метаданных, robots, sitemap и структурированной разметки */

export const SITE_NAME = "Кварта";
export const SITE_TITLE = "Кварта — свежая обжарка кофе в Минске";
export const SITE_DESCRIPTION =
  "Мастерская обжарки в Минске: жарим партиями по 5 кг по четвергам, в пятницу развозим. Зерно у вас на 1–3 день после обжарки.";

/* Абсолютные ссылки: на Vercel — продакшен-домен проекта, локально — дев-сервер */
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";
