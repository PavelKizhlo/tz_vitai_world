import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";

/* Индексировать можно всё; превью-деплои Vercel закрывает от поиска сам заголовком X-Robots-Tag */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
