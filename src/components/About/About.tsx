import Image from "next/image";
import { Lines } from "@/components/ui";
import photo from "../../../public/photos/anya-dmitry.webp";
import styles from "./About.module.css";

export function About() {
  return (
    <section
      id="about"
      className={`ruled ${styles.about}`}
      aria-labelledby="about-title"
      data-grid=""
    >
      <figure className={styles.figure}>
        <div className={styles.photo}>
          <Image
            src={photo}
            alt="Аня и Дмитрий за стойкой мастерской: у Ани чашка, у Дмитрия совок с зерном"
            fill
            placeholder="blur"
            sizes="(max-width: 767px) 100vw, 42vw"
            className={styles.image}
          />
        </div>
      </figure>
      <div className={styles.text}>
        <Lines kind="waves" className={styles.waves} parallax={0.15} />
        <span className="eyebrow">Кто жарит</span>
        <h2 id="about-title" className={styles.title} data-split="" data-split-by="words">
          <span className="heavy">Аня</span>
          <span className={styles.and}>и</span>
          <span className="heavy">Дмитрий</span>
        </h2>
        <p className={styles.lead}>
          Раньше мы работали бариста. С 2019 года жарим сами — маленькими партиями по 5 кг, чтобы
          кофе не залёживался.
        </p>
        <div className={styles.story}>
          <p>
            За стойкой мы каждый день видели одно и то же: хорошее зерно приезжает в кофейню уже
            уставшим, через месяц-два после обжарки. Тогда и решили жарить сами — понемногу и так,
            чтобы кофе доходил до чашки, пока он на пике.
          </p>
          <p>
            Сейчас всё устроено просто. По четвергам Дмитрий стоит у ростера, Аня пробует каждую
            партию и решает, что попадёт в пачки. В пятницу сами развозим заказы по Минску. А если
            заглянете в мастерскую на Короля, 9, — сварим вам чашку и расскажем, что сейчас в
            работе.
          </p>
        </div>
      </div>
    </section>
  );
}
