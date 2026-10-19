import { Sketch } from "@/components/ui";
import styles from "./Divider.module.css";

/**
 * Низкий пустой ряд между формой и футером: три ячейки с обрезанными рисунками.
 * Колонки совпадают с первой строкой футера, поэтому линии сетки идут насквозь.
 * Без data-grid: ряд у самого низа страницы, въезд по скроллу не успел бы доиграть.
 */
export function Divider() {
  return (
    <div className={`ruled ${styles.divider}`} aria-hidden="true">
      <div className={styles.cell}>
        <Sketch name="beans-pile" className={styles.pile} />
      </div>
      <div className={styles.cell}>
        <Sketch name="spoon" className={styles.spoon} />
      </div>
      <div className={styles.cell}>
        <Sketch name="cherries" className={styles.cherries} />
      </div>
    </div>
  );
}
