"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ProductId } from "@/data/catalog";

type OrderContextValue = {
  picked: Set<ProductId>;
  toggle: (id: ProductId) => void;
  add: (id: ProductId) => void;
  clear: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

/** Общий выбор товаров: кнопки «В заявку» в каталоге отмечают позиции в форме */
export function OrderProvider({ children }: { children: ReactNode }) {
  const [picked, setPicked] = useState<Set<ProductId>>(() => new Set());

  const toggle = useCallback((id: ProductId) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const add = useCallback((id: ProductId) => {
    setPicked((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const clear = useCallback(() => setPicked(new Set()), []);

  const value = useMemo(() => ({ picked, toggle, add, clear }), [picked, toggle, add, clear]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder должен вызываться внутри OrderProvider");
  return ctx;
}
