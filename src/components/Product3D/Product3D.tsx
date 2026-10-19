"use client";

import dynamic from "next/dynamic";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { products } from "@/data/catalog";
import { cx } from "@/components/ui";
import { BLEED, PRODUCTS_3D, type Product3DId } from "./config";
import { useMotionMode } from "@/components/Motion/motion";
import { enqueueWarmup, warmupDone } from "./warmup";
import styles from "./Product3D.module.css";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

type Product3DProps = {
  product: Product3DId;
  className?: string;
};

/** 3D-модель товара: пачка или коробка с этикеткой. Размер слота задаёт className родителя */
export function Product3D({ product, className }: Product3DProps) {
  const root = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const mode = useMotionMode();
  const mountedRef = useRef(false);
  const [warmup] = useState(() => ({
    start: () => {
      if (mountedRef.current) return false;
      mountedRef.current = true;
      setMounted(true);
      return true;
    },
  }));
  const onReady = useCallback(() => {
    setReady(true);
    warmupDone(warmup);
  }, [warmup]);

  // Сцены ниже экрана создаём заранее, по очереди, пока браузер простаивает
  useEffect(() => enqueueWarmup(warmup), [warmup]);

  // Слот у экрана создаём сразу, не дожидаясь очереди; уехал — ставим сцену на паузу
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          mountedRef.current = true;
          setMounted(true);
        }
      },
      // Запас в экран: при быстром скролле сцена успевает собраться до появления слота
      { rootMargin: "100% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { name, origin } = products[product];
  const kind = PRODUCTS_3D[product].model === "box" ? "Коробка" : "Пачка";

  return (
    <div
      ref={root}
      role="img"
      aria-label={`${kind} «${name}», ${origin}`}
      className={cx(styles.root, className)}
      style={{ "--bleed": BLEED } as CSSProperties}
    >
      {mounted && (
        <div className={cx(styles.stage, ready && styles.ready)}>
          <Scene product={product} mode={mode} active={visible} onReady={onReady} />
        </div>
      )}
    </div>
  );
}
