import type { Metadata, Viewport } from "next";
import { Caveat, Onest, Unbounded } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/data/site";
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

/* Картинку для превью отдаёт app/opengraph-image.tsx, Next подставит её сам */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: "ru_RU",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
