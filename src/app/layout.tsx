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

export const metadata: Metadata = {
  title: "Кварта — свежая обжарка кофе в Минске",
  description:
    "Мастерская обжарки в Минске: жарим партиями по 5 кг по четвергам, в пятницу развозим. Зерно у вас на 1–3 день после обжарки.",
};

export const viewport: Viewport = {
  themeColor: "#fbf5ec",
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
