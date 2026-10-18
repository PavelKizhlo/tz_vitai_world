import Image from "next/image";
import deliveryPhoto from "../../../public/photos/delivery.webp";
import hoursPhoto from "../../../public/photos/hours.webp";
import pickupPhoto from "../../../public/photos/pickup.webp";
import styles from "./Delivery.module.css";

const PHOTO_SIZES = "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 42vw";

/**
 * Три ячейки, фото во всю ширину ячейки на половину её высоты:
 * у доставки и самовывоза фото снизу, у часов — сверху. Текст всегда начинается с рубрики
 */
export function Delivery() {
  return (
    <section
      id="delivery"
      className={`ruled ${styles.delivery}`}
      aria-label="Доставка и самовывоз"
      data-grid=""
    >
      <div className={`${styles.cell} ${styles.photoBottom}`}>
        <div className={styles.photo}>
          <Image
            src={deliveryPhoto}
            alt="Дмитрий с пачкой кофе звонит в дверь квартиры"
            fill
            placeholder="blur"
            sizes={PHOTO_SIZES}
            className={styles.image}
          />
        </div>
        <div className={styles.text}>
          <span className="eyebrow">Доставка</span>
          <p className={styles.value}>
            в <span className="heavy">пятницу</span> по&nbsp;Минску
          </p>
          <p>От 50 BYN — бесплатно.</p>
        </div>
      </div>
      <div className={`${styles.cell} ${styles.photoBottom}`}>
        <div className={styles.photo}>
          <Image
            src={pickupPhoto}
            alt="Гости с чашками и пачкой кофе у входа в мастерскую"
            fill
            placeholder="blur"
            sizes={PHOTO_SIZES}
            className={styles.image}
          />
        </div>
        <div className={styles.text}>
          <span className="eyebrow">Самовывоз</span>
          <p className={styles.value}>
            ул.&nbsp;<span className="heavy">Короля, 9</span>
          </p>
          <p>Минск, мастерская</p>
        </div>
      </div>
      <div className={`${styles.cell} ${styles.hours}`}>
        <div className={styles.photo}>
          <Image
            src={hoursPhoto}
            alt="Утро в мастерской: часы на стене, чайник и кофемолка на стойке"
            fill
            placeholder="blur"
            sizes={PHOTO_SIZES}
            className={styles.image}
          />
        </div>
        <div className={styles.text}>
          <span className="eyebrow">Часы</span>
          <p className={styles.schedule}>
            <span className="thin">пн–пт</span> <b>8:00–20:00</b>
            <br />
            <span className="thin">сб–вс</span> <b>10:00–18:00</b>
          </p>
        </div>
      </div>
    </section>
  );
}
