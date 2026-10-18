import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";

/*
 * Превью для соцсетей и мессенджеров: та же сетка, что на сайте — слева заголовок из hero,
 * справа знак на бежевом фоне с зёрнами, снизу синяя строка как в бегущей ленте.
 */

export const alt = "Кварта — кофе, обжаренный в этот четверг. Мастерская обжарки, Минск";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#1c2b5f";
const NAVY_MUTED = "#5d6790";
const GOLD = "#9c8659";
const GOLD_100 = "#f7f4ee";
const RULE = `1px solid ${GOLD}`;

const EYEBROW = "Мастерская обжарки · Минск";
// Строки заголовка заданы явно: Satori не переносит текст вместе с соседним span
const TITLE = ["Кофе,", "обжаренный в", "этот"];
const ACCENT = "четверг";
const STRIP = [
  ["обжариваем по ", "четвергам"],
  ["развозим по ", "пятницам"],
] as const;

// Со старым User-Agent Google Fonts отдаёт TTF (Satori не читает woff2); text= режет файл до нужных букв
async function loadFont(family: string, weight: number, text: string) {
  "use cache";
  cacheLife("max");
  const params = `family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(`https://fonts.googleapis.com/css2?${params}`, {
    headers: { "User-Agent": "Mozilla/4.0" },
  }).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`Не нашёл TTF для ${family} ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

// SVG из public как data URL; цвет рисунка меняется подменой заливки.
// Кешируется, как и шрифты, — иначе чтение файла делает картинку динамической
async function svgDataUrl(path: string, recolor?: [string, string]) {
  "use cache";
  cacheLife("max");
  let svg = await readFile(join(process.cwd(), "public", path), "utf8");
  if (recolor) svg = svg.replaceAll(`fill="${recolor[0]}"`, `fill="${recolor[1]}"`);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default async function OpengraphImage() {
  const stripText = STRIP.flat().join("").toUpperCase();
  const [thin, heavy, medium, logo, mark, beans] = await Promise.all([
    loadFont("Unbounded", 200, TITLE.join(" ")),
    loadFont("Unbounded", 900, ACCENT + stripText),
    loadFont("Unbounded", 500, EYEBROW.toUpperCase() + stripText),
    svgDataUrl("logo/kvarta-logo.svg"),
    svgDataUrl("logo/kvarta-mark.svg"),
    svgDataUrl("coffee_set/beans-scattered.svg", [NAVY, GOLD]),
  ]);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#ffffff",
        fontFamily: "Unbounded",
        color: NAVY,
      }}
    >
      <div style={{ display: "flex", flexGrow: 1, borderBottom: RULE }}>
        {/* Текст */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 760,
            padding: "56px 64px",
            borderRight: RULE,
          }}
        >
          <img src={logo} width={234} height={48} alt="" />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div
              style={{
                fontWeight: 500,
                fontSize: 18,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: NAVY_MUTED,
              }}
            >
              {EYEBROW}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontWeight: 200,
                fontSize: 64,
                lineHeight: 1.1,
                letterSpacing: -1,
              }}
            >
              {TITLE.slice(0, -1).map((line) => (
                <div key={line}>{line}</div>
              ))}
              <div style={{ display: "flex", gap: 22 }}>
                {TITLE.at(-1)}
                <span style={{ fontWeight: 900, color: GOLD }}>{ACCENT}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Знак на бежевом фоне с зёрнами */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background: GOLD_100,
          }}
        >
          <img
            src={beans}
            width={418}
            height={468}
            alt=""
            style={{ position: "absolute", top: -90, right: -120, opacity: 0.35 }}
          />
          <img
            src={beans}
            width={334}
            height={374}
            alt=""
            style={{ position: "absolute", bottom: -150, left: -110, opacity: 0.35 }}
          />
          <img src={mark} width={220} height={220} alt="" />
        </div>
      </div>

      {/* Синяя строка как бегущая лента */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          height: 96,
          padding: "0 64px",
          background: NAVY,
          color: "#ffffff",
          fontSize: 22,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {STRIP.map(([lead, bold], i) => (
          <div key={bold} style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {i > 0 && <div style={{ width: 12, height: 12, background: GOLD }} />}
            <div style={{ display: "flex", fontWeight: 500 }}>
              {lead}
              <span style={{ fontWeight: 900, marginLeft: 10 }}>{bold}</span>
            </div>
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Unbounded", data: thin, weight: 200, style: "normal" },
        { name: "Unbounded", data: medium, weight: 500, style: "normal" },
        { name: "Unbounded", data: heavy, weight: 900, style: "normal" },
      ],
    },
  );
}
