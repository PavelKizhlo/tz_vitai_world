import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/site";

/* Лендинг из одной страницы; ассортимент меняется по неделям — обжарка каждый четверг */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: "weekly", priority: 1 }];
}
