import styles from "./button.module.css";

type ButtonOptions = {
  variant?: "primary" | "line";
  /** lg — крупная ячейка во всю ширину, как отправка формы */
  size?: "md" | "lg";
  className?: string;
};

export function buttonClass({ variant = "primary", size = "md", className }: ButtonOptions = {}) {
  return [styles.button, styles[variant], size === "lg" && styles.lg, className]
    .filter(Boolean)
    .join(" ");
}
