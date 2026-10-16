export type ProductId = "ethiopia" | "colombia" | "brazil" | "drip" | "subscription";

export type Product = {
  id: ProductId;
  name: string;
  origin: string;
  notes: string;
  price: number;
  unit: string;
};

export const products: Record<ProductId, Product> = {
  ethiopia: {
    id: "ethiopia",
    name: "Эфиопия",
    origin: "Иргачеффе",
    notes: "цветочный, бергамот",
    price: 32,
    unit: "BYN",
  },
  colombia: {
    id: "colombia",
    name: "Колумбия",
    origin: "Уила",
    notes: "карамель, красное яблоко",
    price: 29,
    unit: "BYN",
  },
  brazil: {
    id: "brazil",
    name: "Бразилия",
    origin: "Серрадо",
    notes: "орех, шоколад",
    price: 26,
    unit: "BYN",
  },
  drip: {
    id: "drip",
    name: "Дрип-пакеты",
    origin: "ассорти · 10 шт",
    notes: "Повесьте на чашку, залейте водой — и кофе готов: дома, в офисе, в дороге.",
    price: 18,
    unit: "BYN",
  },
  subscription: {
    id: "subscription",
    name: "Подписка",
    origin: "2 пачки раз в месяц",
    notes: "По 250 г, доставка бесплатно",
    price: 54,
    unit: "BYN / МЕС",
  },
};

export const productOrder: ProductId[] = ["ethiopia", "colombia", "brazil", "drip", "subscription"];

export type DeliveryWay = "delivery" | "pickup";

export const deliveryWays: { id: DeliveryWay; label: string }[] = [
  { id: "delivery", label: "Доставка в пятницу" },
  { id: "pickup", label: "Самовывоз, ул. Короля, 9" },
];
