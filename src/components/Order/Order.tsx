import Image from "next/image";
import { Shape } from "@/components/ui";
import photo from "../../../public/photos/order.webp";
import { OrderForm } from "./OrderForm";
import styles from "./Order.module.css";

export function Order() {
  return (
    <section
      id="order"
      className={`ruled ${styles.order}`}
      aria-labelledby="order-title"
      data-grid=""
    >
      <div className={styles.intro}>
        <div className={styles.introText}>
          <span className="eyebrow">Заявка</span>
          <h2 id="order-title" className={styles.title} data-split="">
            Отметьте, что хотите <span className="heavy">попробовать</span>
          </h2>
          <p className={styles.lead}>Мы свяжемся, уточним заказ и привезём в ближайшую пятницу.</p>
        </div>
        <div className={styles.photo}>
          <Image
            src={photo}
            alt="Три чашки кофе и открытые пачки зерна на стойке, гость выбирает"
            fill
            placeholder="blur"
            sizes="(max-width: 1023px) 100vw, 42vw"
            className={styles.image}
          />
          {/* Четверть круга заходит на угол фото, не задевая текст */}
          <Shape kind="quarter" colors={["dusty-blue"]} parallax={0.2} className={styles.quarter} />
        </div>
      </div>
      <div className={styles.formCell}>
        <OrderForm />
      </div>
    </section>
  );
}
