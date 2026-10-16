import { Shape } from "@/components/ui";
import { OrderForm } from "./OrderForm";
import styles from "./Order.module.css";

export function Order() {
  return (
    <section id="order" className={`ruled ${styles.order}`} aria-labelledby="order-title">
      <div className={styles.intro}>
        <span className="eyebrow">Заявка</span>
        <h2 id="order-title" className={`anim-track-in ${styles.title}`}>
          Отметьте, что хотите <span className="heavy">попробовать</span>
        </h2>
        <p className={styles.lead}>Мы свяжемся, уточним заказ и привезём в ближайшую пятницу.</p>
        <Shape kind="quarter" colors={["dusty-blue"]} className={styles.quarter} />
      </div>
      <div className={styles.formCell}>
        <OrderForm />
      </div>
    </section>
  );
}
