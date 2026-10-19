import { productOrder, products } from "@/data/catalog";
import { phone } from "@/data/contacts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/data/site";

/**
 * Разметка schema.org для поисковиков: мастерская с адресом, часами, телефоном и ассортиментом.
 * Адрес и часы повторяют футер — менять вместе.
 */
const prices = productOrder.map((id) => products[id].price);

const shop = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  "@id": `${SITE_URL}/#shop`,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  logo: `${SITE_URL}/icon.svg`,
  telephone: phone.href.replace("tel:", ""),
  foundingDate: "2019",
  founder: [
    { "@type": "Person", name: "Аня" },
    { "@type": "Person", name: "Дмитрий" },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Короля, 9",
    addressLocality: "Минск",
    addressCountry: "BY",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "10:00",
      closes: "18:00",
    },
  ],
  servesCuisine: "Кофе",
  priceRange: `${Math.min(...prices)}–${Math.max(...prices)} BYN`,
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Что жарим сейчас",
    itemListElement: productOrder.map((id) => ({
      "@type": "Offer",
      price: products[id].price,
      priceCurrency: "BYN",
      availability: "https://schema.org/InStock",
      itemOffered: {
        "@type": "Product",
        name: products[id].name,
        description: products[id].description[0],
      },
    })),
  },
};

/** JSON для <script type="application/ld+json">; «<» экранируется, чтобы текст не закрыл тег */
export const shopJsonLd = JSON.stringify(shop).replace(/</g, "\\u003c");
