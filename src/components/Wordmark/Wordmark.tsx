import styles from "./Wordmark.module.css";

/** Крупное название из квадратов: при прокрутке пустые квадраты переворачиваются буквами */
export function Wordmark() {
  return (
    <div role="img" aria-label="Кварта" className={`ruled ${styles.wordmark}`} data-grid="lines">
      <span className={styles.arrowCell}>
        <svg className={`anim-slide ${styles.arrow}`} viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 8 V82 M18 54 L50 86 L82 54" />
        </svg>
      </span>
      {"КВАРТА".split("").map((letter, i) => (
        <span key={i} className={styles.cell} aria-hidden="true">
          {/* Без JS перевёртыш уже повёрнут буквой к зрителю */}
          <span className={styles.flipper} data-flip="">
            <span className={styles.front} />
            <span className={`${styles.back} ${i === 5 ? styles.backAccent : ""}`}>
              <span className={i % 2 === 0 ? styles.heavy : styles.light}>{letter}</span>
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
