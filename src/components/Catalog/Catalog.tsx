import { products, type Product } from "@/data/catalog";
import { AddToOrder } from "@/components/Order/AddToOrder";
import { Badge, Photo, Price, Shape, Waves, cx } from "@/components/ui";
import styles from "./Catalog.module.css";

type NameSize = "xl" | "l" | "m";

function ProductName({ product, size }: { product: Product; size: NameSize }) {
  return (
    <h3 className={cx(styles.name, styles[`name-${size}`])}>
      <span className={styles.nameMain}>{product.name}</span>
      <span className={styles.origin}>{product.origin}</span>
    </h3>
  );
}

export function Catalog() {
  const { ethiopia, colombia, brazil, drip, subscription } = products;

  return (
    <>
      <div id="coffee" className={`ruled ${styles.anchor}`}>
        <div className={styles.heading}>
          <Waves className={styles.headingWaves} />
          <h2 className={`anim-track-in ${styles.title}`}>Что жарим&nbsp;сейчас</h2>
          <span className="eyebrow">все пачки по 250 г</span>
        </div>
      </div>

      {/* Строка 1: Эфиопия */}
      <article className={`ruled ${styles.card} ${styles.feature}`}>
        <div className={cx(styles.media, styles.mediaFeature)}>
          <Shape kind="circle" colors={["ochre"]} className={styles.ethiopiaSun} />
          <Shape kind="half" colors={["surface-100"]} className={styles.ethiopiaHill} />
          <Photo caption="фото пачки" className={styles.photoFeature} />
        </div>
        <div className={styles.body}>
          <Badge tone="sage">Светлая обжарка</Badge>
          <ProductName product={ethiopia} size="xl" />
          <p className={styles.notes}>{ethiopia.notes}</p>
          <div className={styles.buy}>
            <Price value={ethiopia.price} unit={ethiopia.unit} />
            <AddToOrder product="ethiopia" />
          </div>
        </div>
      </article>

      {/* Строка 2: Колумбия + Бразилия */}
      <section aria-label="Колумбия и Бразилия" className={`ruled ${styles.pair}`}>
        <article className={cx(styles.card, styles.tile)}>
          <div className={cx(styles.media, styles.mediaTile, styles.mediaPeach)}>
            <Shape kind="half" colors={["coral"]} className={styles.colombiaHill} />
            <Photo caption="фото пачки" className={styles.photoTile} />
          </div>
          <div className={styles.tileBody}>
            <ProductName product={colombia} size="m" />
            <p className={styles.notesSm}>{colombia.notes}</p>
            <div className={styles.tileBuy}>
              <Price value={colombia.price} unit={colombia.unit} size="m" />
              <AddToOrder product="colombia" size="sm" />
            </div>
          </div>
        </article>
        <article className={cx(styles.card, styles.tile)}>
          <div className={cx(styles.media, styles.mediaTile, styles.mediaSand)}>
            <Shape kind="quarter" colors={["denim"]} className={styles.brazilQuarter} />
            <Shape kind="circle" colors={["coral"]} className={styles.brazilDot} />
            <Photo caption="фото пачки" tone="200" className={styles.photoTile} />
          </div>
          <div className={styles.tileBody}>
            <Badge tone="coral">Под эспрессо</Badge>
            <ProductName product={brazil} size="m" />
            <p className={styles.notesSm}>{brazil.notes}</p>
            <div className={styles.tileBuy}>
              <Price value={brazil.price} unit={brazil.unit} size="m" />
              <AddToOrder product="brazil" size="sm" />
            </div>
          </div>
        </article>
      </section>

      {/* Строка 3: дрип-пакеты + подписка */}
      <section aria-label="Дрип-пакеты и подписка" className={`ruled ${styles.extras}`}>
        <article className={cx(styles.card, styles.drip)}>
          <div className={cx(styles.media, styles.mediaDrip)}>
            <Shape kind="quarter" colors={["sage"]} className={styles.dripQuarter} />
            <Shape
              kind="halves-row"
              colors={["ochre", "coral"]}
              motion="slide"
              className={styles.dripHalves}
            />
            <Photo caption="фото коробки дрип-пакетов" className={styles.photoSquare} />
          </div>
          <div className={styles.body}>
            <Badge tone="neutral">Без кофемашины</Badge>
            <ProductName product={drip} size="l" />
            <p className={styles.notes}>{drip.notes}</p>
            <div className={styles.buy}>
              <Price value={drip.price} unit={drip.unit} />
              <AddToOrder product="drip" />
            </div>
          </div>
        </article>

        <article className={styles.subscription}>
          <Shape kind="circle" colors={["dusty-blue"]} className={styles.subscriptionDot} />
          <div className={styles.subscriptionText}>
            <span className="eyebrow">{subscription.name}</span>
            <h3 className={styles.subscriptionTitle}>
              <span className="heavy">2&nbsp;пачки</span> раз в&nbsp;месяц
            </h3>
            <p>{subscription.notes}</p>
          </div>
          <div className={styles.subscriptionBuy}>
            <Price value={subscription.price} unit={subscription.unit} />
            <AddToOrder product="subscription" filled>
              Оформить подписку
            </AddToOrder>
          </div>
        </article>
      </section>
    </>
  );
}
