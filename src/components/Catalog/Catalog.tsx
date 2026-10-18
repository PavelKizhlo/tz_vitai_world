import { products, type Product } from "@/data/catalog";
import { AddToOrder } from "@/components/Order/AddToOrder";
import { Badge, Lines, Price, cx } from "@/components/ui";
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
          <Lines kind="waves" className={styles.headingWaves} parallax={0.15} />
          <h2 className={styles.title} data-split="">
            Что жарим&nbsp;сейчас
          </h2>
          <span className="eyebrow">все пачки по 250 г</span>
        </div>
      </div>

      {/* Строка 1: Эфиопия */}
      <article className={`ruled ${styles.card} ${styles.feature}`} data-grid="">
        <div className={cx(styles.media, styles.mediaFeature)}>
          <Lines kind="rays" parallax={0.25} className={styles.ethiopiaRays} />
          <Lines kind="zigzag" reverse className={styles.ethiopiaZigzag} />
          <FlightSlot id="catalog" className={styles.photoFeature} />
        </div>
        <div className={styles.body}>
          <div className={styles.bodyMain}>
            <Badge tone="navy">Светлая обжарка</Badge>
            <ProductName product={ethiopia} size="xl" />
            <p className={styles.notes}>{ethiopia.notes}</p>
            <Description product={ethiopia} />
          </div>
          <div className={styles.buy}>
            <div className={styles.buyPrice}>
              <Price value={ethiopia.price} unit={ethiopia.unit} />
            </div>
            <AddToOrder product="ethiopia" />
          </div>
        </div>
      </article>

      {/* Строка 2: Колумбия + Бразилия */}
      <section aria-label="Колумбия и Бразилия" className={`ruled ${styles.pair}`} data-grid="">
        <article className={cx(styles.card, styles.tile)}>
          <div className={cx(styles.media, styles.mediaTile, styles.mediaPale)}>
            <Lines kind="squares" className={styles.colombiaSquares} />
            <Product3D product="colombia" className={styles.photoTile} />
          </div>
          <div className={styles.tileBody}>
            <div className={styles.tileMain}>
              <ProductName product={colombia} size="m" />
              <p className={styles.notesSm}>{colombia.notes}</p>
              <Description product={colombia} small />
            </div>
            <div className={styles.buy}>
              <div className={styles.buyPrice}>
                <Price value={colombia.price} unit={colombia.unit} size="m" />
              </div>
              <AddToOrder product="colombia" />
            </div>
          </div>
        </article>
        <article className={cx(styles.card, styles.tile)}>
          <div className={cx(styles.media, styles.mediaTile, styles.mediaSand)}>
            <Lines kind="waves" className={styles.brazilWaves} />
            <Lines kind="rosette" reverse parallax={0.4} className={styles.brazilRosette} />
            <Product3D product="brazil" className={styles.photoTile} />
          </div>
          <div className={styles.tileBody}>
            <div className={styles.tileMain}>
              <Badge tone="gold">Под эспрессо</Badge>
              <ProductName product={brazil} size="m" />
              <p className={styles.notesSm}>{brazil.notes}</p>
              <Description product={brazil} small />
            </div>
            <div className={styles.buy}>
              <div className={styles.buyPrice}>
                <Price value={brazil.price} unit={brazil.unit} size="m" />
              </div>
              <AddToOrder product="brazil" />
            </div>
          </div>
        </article>
      </section>

      {/* Строка 3: дрип-пакеты */}
      <article className={cx("ruled", styles.card, styles.drip)} data-grid="">
        <div className={cx(styles.media, styles.mediaDrip)}>
          <Lines kind="spiral" className={styles.dripSpiral} />
          <Lines kind="rays" reverse className={styles.dripRays} />
          <Product3D product="drip" className={styles.photoSquare} />
        </div>
        <div className={styles.body}>
          <div className={styles.bodyMain}>
            <Badge tone="neutral">Без кофемашины</Badge>
            <ProductName product={drip} size="l" />
            <p className={styles.notes}>{drip.notes}</p>
            <Description product={drip} />
          </div>
          <div className={styles.buy}>
            <div className={styles.buyPrice}>
              <Price value={drip.price} unit={drip.unit} />
            </div>
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
          <Lines kind="zigzag" parallax={0.2} className={styles.subscriptionZigzag} />
          <div className={styles.subscriptionPrice}>
            <Price value={subscription.price} unit={subscription.unit} />
          </div>
          <AddToOrder product="subscription" className={styles.subscriptionButton}>
            Оформить подписку
          </AddToOrder>
        </div>
      </article>
    </>
  );
}
