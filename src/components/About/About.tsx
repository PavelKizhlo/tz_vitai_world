import { Photo, Waves } from "@/components/ui";
import styles from "./About.module.css";

export function About() {
  return (
    <section id="about" className={`ruled ${styles.about}`} aria-labelledby="about-title">
      <figure className={styles.figure}>
        <Photo caption="фото: Аня и Дмитрий у ростера" className={styles.photo} />
        <figcaption className={styles.caption}>аня и дмитрий, четверг утром</figcaption>
      </figure>
      <div className={styles.text}>
        <Waves className={styles.waves} />
        <span className="eyebrow">Кто жарит</span>
        <h2 id="about-title" className={`anim-track-in ${styles.title}`}>
          <span className="heavy">Аня</span>
          <span className={styles.and}>и</span>
          <span className="heavy">Дмитрий</span>
        </h2>
        <p className={styles.lead}>
          Раньше мы работали бариста. С 2019 года жарим сами — маленькими партиями по 5 кг, чтобы
          кофе не залёживался.
        </p>
      </div>
    </section>
  );
}
