import styles from "./Delivery.module.css";

export function Delivery() {
  return (
    <section id="delivery" className={`ruled ${styles.delivery}`} aria-label="Доставка и самовывоз">
      <div className={styles.cell}>
        <span className="eyebrow">Доставка</span>
        <p className={styles.value}>
          в <span className="heavy">пятницу</span> по&nbsp;Минску
        </p>
        <p>От 50 BYN — бесплатно.</p>
      </div>
      <div className={styles.cell}>
        <span className="eyebrow">Самовывоз</span>
        <p className={styles.value}>
          ул.&nbsp;<span className="heavy">Короля, 9</span>
        </p>
        <p>Минск, мастерская</p>
      </div>
      <div className={`${styles.cell} ${styles.hours}`}>
        <span className="eyebrow">Часы</span>
        <p className={styles.schedule}>
          <span className="thin">пн–пт</span> <b>8:00–20:00</b>
          <br />
          <span className="thin">сб–вс</span> <b>10:00–18:00</b>
        </p>
      </div>
    </section>
  );
}
