"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ProductId } from "@/data/catalog";

type OrderContextValue = {
  picked: Set<ProductId>;
  /** Выбран вариант «Задать вопрос» — он исключает товары */
  asking: boolean;
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
  toggleAsking: () => void;
  clear: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

/**
 * Общий выбор товаров: кнопки «В заявку» в каталоге отмечают позиции в форме.
 * Вопрос и товары взаимоисключающие: вопрос сбрасывает товары, выбор товара снимает вопрос.
 */
export function OrderProvider({ children }: { children: ReactNode }) {
  const [picked, setPicked] = useState<Set<ProductId>>(() => new Set());
  const [asking, setAsking] = useState(false);

  const toggle = useCallback((id: ProductId) => {
    setAsking(false);
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const add = useCallback((id: ProductId) => {
    setAsking(false);
    setPicked((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const toggleAsking = useCallback(() => {
    setPicked(new Set());
    setAsking((prev) => !prev);
  }, []);

  const clear = useCallback(() => {
    setPicked(new Set());
    setAsking(false);
  }, []);

  const value = useMemo(
    () => ({ picked, asking, toggle, add, toggleAsking, clear }),
    [picked, asking, toggle, add, toggleAsking, clear],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder должен вызываться внутри OrderProvider");
  return ctx;
}
