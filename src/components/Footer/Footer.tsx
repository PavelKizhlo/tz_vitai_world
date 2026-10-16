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
      <p className={styles.credits}>
        3D-модели:{" "}
        <a
          href="https://sketchfab.com/3d-models/coffee-paper-bag-12e825336da1435a8decc198ea9fc06d"
          className={styles.link}
        >
          Coffee Paper Bag
        </a>{" "}
        — clon6767,{" "}
        <a
          href="https://sketchfab.com/3d-models/lipton-mandarin-orange-tea-box-low-poly-prop-22d68744e4294f3984a498f842e7a3df"
          className={styles.link}
        >
          Tea Box
        </a>{" "}
        — Vlaxled,{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" className={styles.link}>
          CC BY 4.0
        </a>
      </p>
    </footer>
  );
}
