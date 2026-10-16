"use client";

import type { ReactNode } from "react";
import type { ProductId } from "@/data/catalog";
import { buttonClass } from "@/components/ui/button";
import { useOrder } from "./OrderContext";

type AddToOrderProps = {
  product: ProductId;
  size?: "md" | "sm";
  filled?: boolean;
  children?: ReactNode;
};

/** Ссылка на форму заявки, заодно отмечает товар в форме */
export function AddToOrder({
  product,
  size = "md",
  filled,
  children = "В заявку",
}: AddToOrderProps) {
  const { add } = useOrder();

  return (
    <a
      href="#order"
      onClick={() => add(product)}
      className={buttonClass({ variant: "line", size, filled })}
    >
      {children}
    </a>
  );
}
