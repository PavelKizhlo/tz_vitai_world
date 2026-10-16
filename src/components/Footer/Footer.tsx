import { Logo } from "@/components/ui";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <Logo variant="footer" label="Кварта" />
      </div>
      <p className={styles.cell}>
        Минск, ул. Короля, 9
        <br />
        пн–пт 8:00–20:00
        <br />
        сб–вс 10:00–18:00
      </p>
      <p className={styles.cell}>
        Обжарка — четверг
        <br />
        Доставка — пятница
        <br />
        <a href="#order" className={styles.link}>
          Оставить заявку
        </a>
      </p>
    </footer>
  );
}
