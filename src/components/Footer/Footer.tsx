import type { ReactNode } from "react";
import { Logo, Sketch } from "@/components/ui";
import { buttonClass } from "@/components/ui/button";
import styles from "./Footer.module.css";

// Ссылки пока ведут наверх страницы — заменить на настоящие профили
const socials: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: "Instagram",
    href: "#top",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1.1" className={styles.iconFill} />
      </>
    ),
  },
  {
    label: "Telegram",
    href: "#top",
    icon: <path d="M21.5 4.5 2.5 11.8l6.3 2.1L18 7.5l-7.2 7.4.3 5.6 3.3-4.1 4.6 3.5z" />,
  },
  {
    label: "YouTube",
    href: "#top",
    icon: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10 9.2v5.6l5-2.8z" className={styles.iconFill} />
      </>
    ),
  },
];

/**
 * Футер — такой же ряд-сетка, как секции: сверху логотип и две колонки текста,
 * снизу ячейки-кнопки соцсетей и копирайт
 */
export function Footer() {
  return (
    <footer className={`ruled ${styles.footer}`}>
      <div className={styles.brand}>
        <Logo variant="footer" label="Кварта" />
      </div>
      <div className={styles.cell}>
        <span className="eyebrow">Мастерская</span>
        <p>
          Минск, ул. Короля, 9
          <br />
          пн–пт 8:00–20:00
          <br />
          сб–вс 10:00–18:00
        </p>
      </div>
      <div className={styles.cell}>
        <span className="eyebrow">Неделя</span>
        <p>
          Обжарка — четверг
          <br />
          Доставка — пятница
        </p>
      </div>
      {socials.map((social) => (
        <a
          key={social.label}
          href={social.href}
          aria-label={social.label}
          className={buttonClass({ variant: "line", className: styles.social })}
        >
          <span className={styles.socialLabel}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
              {social.icon}
            </svg>
            <span className={styles.socialName}>{social.label}</span>
          </span>
        </a>
      ))}
      <p className={styles.copyright}>
        <Sketch name="beans-row" className={styles.beans} />
        <span>© 2019–{new Date().getFullYear()} Кварта</span>
        <span className={styles.copyrightNote}>Мастерская обжарки, Минск</span>
      </p>
    </footer>
  );
}
