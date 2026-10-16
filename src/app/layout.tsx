import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tz_vitai_world",
  description: "",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
