import { buttonClass } from "@/components/ui/button";
import { Lines } from "@/components/ui";
import { FlightSlot } from "@/components/Motion/FlightProduct";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section
      id="top"
      className={`ruled ${styles.hero}`}
      aria-labelledby="hero-title"
      data-grid="intro"
    >
      <div className={styles.text}>
        <Lines kind="waves" className={styles.waves} parallax={0.15} />
        <div className={styles.copy}>
          <span className="eyebrow">Мастерская обжарки · Минск</span>
          <h1 id="hero-title" className={styles.title} data-split="intro">
            Кофе, обжаренный в этот&nbsp;<span className={styles.accent}>четверг</span>
          </h1>
          <p className={styles.lead}>
            Жарим партиями по 5 кг, в пятницу развозим по Минску. Зерно у вас на 1–3 день после
            обжарки.
          </p>
        </div>
        <div className={styles.actions}>
          <a href="#order" className={buttonClass({ variant: "primary" })}>
            Оставить заявку
          </a>
          <a href="#coffee" className={buttonClass({ variant: "line" })}>
            Посмотреть кофе
          </a>
        </div>
      </div>

      <div className={styles.visual}>
        <Lines kind="rosette" parallax={0.15} className={styles.rosette} />
        <Lines kind="spiral" reverse parallax={0.35} className={styles.spiral} />
        <FlightSlot id="hero" className={styles.photo} />
        <span className={`anim-breathe ${styles.tag}`} aria-hidden="true">
          свежая партия
        </span>
      </div>
    </section>
  );
}
