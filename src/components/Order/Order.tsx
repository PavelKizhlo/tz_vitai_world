import Image from "next/image";
import { Sketch } from "@/components/ui";
import phonePhoto from "../../../public/photos/order-phone.webp";
import { OrderForm } from "./OrderForm";
import styles from "./Order.module.css";

/** Первый ряд — текст и фото, второй — форма во всю ширину контейнера */
export function Order() {
  return (
    <section
      id="order"
      className={`ruled ${styles.order}`}
      aria-labelledby="order-title"
      data-grid=""
    >
      <div className={styles.intro}>
        <Sketch name="branch-leaves" parallax={0.25} className={styles.leaves} />
        <span className="eyebrow">Заявка</span>
        <h2 id="order-title" className={styles.title} data-split="">
          Отметьте, что хотите <span className="heavy">попробовать</span>
        </h2>
        <p className={styles.lead}>Мы свяжемся, уточним заказ и привезём в ближайшую пятницу.</p>
      </div>
      <div className={styles.photo}>
        <Image
          src={phonePhoto}
          alt="Аня говорит по телефону у стойки мастерской"
          fill
          placeholder="blur"
          sizes="(max-width: 1023px) 100vw, 58vw"
          className={styles.image}
        />
        <Sketch name="beans-scattered" parallax={0.2} className={styles.beans} />
      </div>
      <div className={styles.formCell}>
        <OrderForm />
      </div>
    </section>
  );
}
