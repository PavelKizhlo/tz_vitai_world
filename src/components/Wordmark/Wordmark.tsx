import Image from "next/image";
import photo1 from "../../../public/photos/wordmark-1.webp";
import photo2 from "../../../public/photos/wordmark-2.webp";
import photo3 from "../../../public/photos/wordmark-3.webp";
import photo4 from "../../../public/photos/wordmark-4.webp";
import photo5 from "../../../public/photos/wordmark-5.webp";
import photo6 from "../../../public/photos/wordmark-6.webp";
import styles from "./Wordmark.module.css";

/** Снимки мастерской на изнанке букв — по порядку «КВАРТА» */
const PHOTOS = [photo1, photo2, photo3, photo4, photo5, photo6];

/**
 * Крупное название из квадратов: при прокрутке фото переворачиваются буквами,
 * при наведении буква переворачивается обратно к фото
 */
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
          {/* Ховер крутит обёртку, скролл — перевёртыш внутри: повороты складываются */}
          <span className={styles.hover}>
            {/* Без JS перевёртыш уже повёрнут буквой к зрителю */}
            <span className={styles.flipper} data-flip="">
              <span className={styles.front}>
                <Image
                  src={PHOTOS[i]}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 15vw, 13vw"
                  className={styles.photo}
                />
              </span>
              <span className={`${styles.back} ${i === 5 ? styles.backAccent : ""}`}>
                <span className={i % 2 === 0 ? styles.heavy : styles.light}>{letter}</span>
              </span>
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
