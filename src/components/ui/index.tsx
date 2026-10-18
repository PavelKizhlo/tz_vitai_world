import type { ReactNode } from "react";
import styles from "./ui.module.css";

export { Logo } from "./Logo";
export { Lines, LinesDefs } from "./Lines";

export function cx(...names: (string | false | null | undefined)[]) {
  return names.filter(Boolean).join(" ");
}

type PhotoProps = {
  caption: string;
  tone?: "300" | "200";
  className?: string;
};

/** Плейсхолдер под фотографию, пока нет реальных снимков */
export function Photo({ caption, tone = "300", className }: PhotoProps) {
  return (
    <div
      role="img"
      aria-label={caption}
      className={cx(styles.photo, tone === "200" && styles.photoAlt, className)}
    >
      <span className={styles.photoCaption} aria-hidden="true">
        {caption}
      </span>
    </div>
  );
}

type BadgeProps = {
  tone: "navy" | "gold" | "neutral";
  children: ReactNode;
};

const badgeTone = {
  navy: styles.badgeNavy,
  gold: styles.badgeGold,
  neutral: styles.badgeNeutral,
};

export function Badge({ tone, children }: BadgeProps) {
  return <span className={cx(styles.badge, badgeTone[tone])}>{children}</span>;
}

type PriceProps = {
  value: number;
  unit: string;
  size?: "l" | "m";
};

export function Price({ value, unit, size = "l" }: PriceProps) {
  return (
    <span className={cx(styles.price, size === "m" && styles.priceM)}>
      {value}
      <span className={styles.currency}>{unit}</span>
    </span>
  );
}
