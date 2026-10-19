import { useId } from "react";
import styles from "./ui.module.css";

/** Буквы «КВАРТА» из линий и дуг в рамке 100×140, толщина штриха 16 */
const LETTERS = [
  "M8 0V140M14.4 72L100 0M14.4 68L100 140",
  "M8 0V140M8 8H53A31 31 0 0 1 53 70H8M53 70H61A31 31 0 0 1 61 132H8",
  "M8 140V50A42 42 0 0 1 92 50V140M8 94H92",
  "M8 140V0M8 8H54A38 38 0 0 1 54 84H8",
  "M0 8H100M50 8V140",
  "M8 140V50A42 42 0 0 1 92 50V140M8 94H92",
];

type LogoProps = {
  variant?: "header" | "footer";
  /** Подпись для скринридеров; без неё логотип декоративный */
  label?: string;
};

/**
 * Логотип: знак из четырёх плиток (зерно, четверть, «К», «линза») и вордмарк.
 * Плитки — синий и охра в шахматном порядке, буквы вордмарка — currentColor.
 * Исходники для экспорта лежат в public/logo.
 */
export function Logo({ variant = "header", label }: LogoProps) {
  // Чистим id от спецсимволов, чтобы ссылка url(#…) работала в любой версии React
  const clipId = `logo-clip-${useId().replace(/[^\w-]/g, "")}`;
  const clip = `url(#${clipId})`;

  return (
    <svg
      viewBox="0 0 780 160"
      className={variant === "footer" ? styles.logoFooter : styles.logo}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="100" height="140" />
        </clipPath>
      </defs>

      {/* Знак */}
      <rect width="80" height="80" className={styles.logoNavy} />
      <g transform="rotate(35 40 40)">
        <ellipse cx="40" cy="40" rx="24" ry="35" className={styles.logoInset} />
        <path d="M40 7C29 27 51 53 40 73" className={styles.logoInsetLine} />
      </g>
      <rect x="80" width="80" height="80" className={styles.logoGold} />
      <path d="M160 0V80A80 80 0 0 1 80 0Z" className={styles.logoInset} />
      <rect y="80" width="80" height="80" className={styles.logoGold} />
      <g transform="translate(15 85) scale(0.5)">
        <g clipPath={clip}>
          <path d={LETTERS[0]} className={styles.logoMarkLetter} />
        </g>
      </g>
      <rect x="80" y="80" width="80" height="80" className={styles.logoNavy} />
      <path d="M85 155A76 76 0 0 1 155 85A76 76 0 0 1 85 155Z" className={styles.logoInset} />
      <path d="M95 145C114 137 126 103 145 95" className={styles.logoInsetLine} />

      {/* Вордмарк */}
      {LETTERS.map((d, i) => (
        <g key={i} transform={`translate(${212 + i * 97.6} 24) scale(0.8)`}>
          <g clipPath={clip}>
            <path d={d} className={styles.logoLetter} />
          </g>
        </g>
      ))}
    </svg>
  );
}
