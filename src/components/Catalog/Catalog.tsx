import { products, type Product } from "@/data/catalog";
import { AddToOrder } from "@/components/Order/AddToOrder";
import { Badge, Price, Shape, Waves, cx } from "@/components/ui";
import { FlightSlot } from "@/components/Motion/FlightProduct";
import { Product3D } from "@/components/Product3D/Product3D";
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

function Description({ product, small }: { product: Product; small?: boolean }) {
  return (
    <div className={cx(styles.description, small && styles.descriptionSm)}>
      {product.description.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  );
}

export function Catalog() {
  const { ethiopia, colombia, brazil, drip, subscription } = products;

  return (
    <>
      <div id="coffee" className={`ruled ${styles.anchor}`} data-grid="lines">
        <div className={styles.heading}>
          <Waves className={styles.headingWaves} parallax={0.15} />
          <h2 className={styles.title} data-split="">
            Что жарим&nbsp;сейчас
          </h2>
          <span className="eyebrow">все пачки по 250 г</span>
        </div>
      </div>

      {/* Строка 1: Эфиопия */}
      <article className={`ruled ${styles.card} ${styles.feature}`} data-grid="">
        <div className={cx(styles.media, styles.mediaFeature)}>
          <Shape kind="circle" colors={["ochre"]} parallax={0.25} className={styles.ethiopiaSun} />
          <Shape kind="half" colors={["surface-100"]} className={styles.ethiopiaHill} />
          <FlightSlot id="catalog" className={styles.photoFeature} />
        </div>
        <div className={styles.body}>
          <Badge tone="sage">Светлая обжарка</Badge>
          <ProductName product={ethiopia} size="xl" />
          <p className={styles.notes}>{ethiopia.notes}</p>
          <Description product={ethiopia} />
          <div className={styles.buy}>
            <Price value={ethiopia.price} unit={ethiopia.unit} />
            <AddToOrder product="ethiopia" />
          </div>
        </div>
      </article>

      {/* Строка 2: Колумбия + Бразилия */}
      <section aria-label="Колумбия и Бразилия" className={`ruled ${styles.pair}`} data-grid="">
        <article className={cx(styles.card, styles.tile)}>
          <div className={cx(styles.media, styles.mediaTile, styles.mediaPeach)}>
            <Shape kind="half" colors={["coral"]} className={styles.colombiaHill} />
            <Product3D product="colombia" className={styles.photoTile} />
          </div>
          <div className={styles.tileBody}>
            <ProductName product={colombia} size="m" />
            <p className={styles.notesSm}>{colombia.notes}</p>
            <Description product={colombia} small />
            <div className={styles.tileBuy}>
              <Price value={colombia.price} unit={colombia.unit} size="m" />
              <AddToOrder product="colombia" size="sm" />
            </div>
          </div>
        </article>
        <article className={cx(styles.card, styles.tile)}>
          <div className={cx(styles.media, styles.mediaTile, styles.mediaSand)}>
            <Shape kind="quarter" colors={["denim"]} className={styles.brazilQuarter} />
            <Shape kind="circle" colors={["coral"]} parallax={0.4} className={styles.brazilDot} />
            <Product3D product="brazil" className={styles.photoTile} />
          </div>
          <div className={styles.tileBody}>
            <Badge tone="coral">Под эспрессо</Badge>
            <ProductName product={brazil} size="m" />
            <p className={styles.notesSm}>{brazil.notes}</p>
            <Description product={brazil} small />
            <div className={styles.tileBuy}>
              <Price value={brazil.price} unit={brazil.unit} size="m" />
              <AddToOrder product="brazil" size="sm" />
            </div>
          </div>
        </article>
      </section>

      {/* Строка 3: дрип-пакеты */}
      <article className={cx("ruled", styles.card, styles.drip)} data-grid="">
        <div className={cx(styles.media, styles.mediaDrip)}>
          <Shape kind="quarter" colors={["sage"]} className={styles.dripQuarter} />
          <Shape
            kind="halves-row"
            colors={["ochre", "coral"]}
            motion="slide"
            className={styles.dripHalves}
          />
          <Product3D product="drip" className={styles.photoSquare} />
        </div>
        <div className={styles.body}>
          <Badge tone="neutral">Без кофемашины</Badge>
          <ProductName product={drip} size="l" />
          <p className={styles.notes}>{drip.notes}</p>
          <Description product={drip} />
          <div className={styles.buy}>
            <Price value={drip.price} unit={drip.unit} />
            <AddToOrder product="drip" />
          </div>
        </div>
      </article>

      {/* Строка 4: подписка на всю ширину — описание, шаги, оформление */}
      <article
        aria-label={subscription.name}
        className={`ruled ${styles.subscription}`}
        data-grid=""
      >
        <div className={styles.subscriptionText}>
          <span className="eyebrow">{subscription.name}</span>
          <h3 className={styles.subscriptionTitle}>
            <span className="heavy">2&nbsp;пачки</span> раз в&nbsp;месяц
          </h3>
          <p>{subscription.notes}</p>
          <Description product={subscription} small />
        </div>
        <div className={styles.subscriptionSteps}>
          <span className="eyebrow">Как это работает</span>
          <ol className={styles.steps}>
            {subscription.steps?.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
        <div className={styles.subscriptionBuy}>
          <Shape
            kind="circle"
            colors={["dusty-blue"]}
            parallax={0.2}
            className={styles.subscriptionDot}
          />
          <Price value={subscription.price} unit={subscription.unit} />
          <AddToOrder product="subscription" filled>
            Оформить подписку
          </AddToOrder>
        </div>
      </article>
    </>
  );
}
