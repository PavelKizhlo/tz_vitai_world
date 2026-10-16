import styles from "./button.module.css";

type ButtonOptions = {
  variant?: "coral" | "line";
  size?: "md" | "sm";
  /** Залитый фон surface-100 для line-кнопки на цветной подложке */
  filled?: boolean;
  className?: string;
};

export function buttonClass({
  variant = "coral",
  size = "md",
  filled = false,
  className,
}: ButtonOptions = {}) {
  return [
    styles.button,
    styles[variant],
    size === "sm" && styles.sm,
    filled && styles.filled,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
