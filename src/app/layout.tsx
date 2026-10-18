import type { Metadata, Viewport } from "next";
import { Caveat, Onest, Unbounded } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--nf-unbounded",
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--nf-onest",
});

const caveat = Caveat({
  subsets: ["latin", "cyrillic"],
  variable: "--nf-caveat",
});

const TITLE = "Кварта — свежая обжарка кофе в Минске";
const DESCRIPTION =
  "Мастерская обжарки в Минске: жарим партиями по 5 кг по четвергам, в пятницу развозим. Зерно у вас на 1–3 день после обжарки.";

/* Абсолютные ссылки для OG: на Vercel — продакшен-домен проекта, локально — дев-сервер */
const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

/* Картинку для превью отдаёт app/opengraph-image.tsx, Next подставит её сам */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Кварта",
    locale: "ru_RU",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

const FX_PENDING = `if (!matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.dataset.fxPending = "";`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${unbounded.variable} ${onest.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Прячем hero до старта интро (Motion/ScrollScenes), чтобы он не мигнул до анимации */}
        <script dangerouslySetInnerHTML={{ __html: FX_PENDING }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
