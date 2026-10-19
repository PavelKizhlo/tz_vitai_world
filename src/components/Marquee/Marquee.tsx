import { Fragment } from "react";
import styles from "./Marquee.module.css";

const phrases = [
  ["обжариваем по ", "четвергам"],
  ["развозим по ", "пятницам"],
  ["у вас на ", "1–3 день"],
];

/** Бегущая строка: две одинаковые половины, лента сдвигается на −50% */
export function Marquee() {
  return (
    <div className={styles.marquee}>
      <p className="visually-hidden">
        Обжариваем по четвергам, развозим по пятницам, у вас на 1–3 день.
      </p>
      <div className={styles.track} aria-hidden="true">
        {Array.from({ length: 4 }, (_, copy) => (
          <Fragment key={copy}>
            {phrases.map(([text, accent]) => (
              <Fragment key={accent}>
                <span>
                  {text}
                  <b className={styles.accent}>{accent}</b>
                </span>
                <span className={styles.dot}>■</span>
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
