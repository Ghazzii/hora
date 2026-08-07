export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const dictionary = {
  fr: {
    nav: {
      watches: "Montres",
      wishlist: "Favoris",
      cart: "Panier",
      account: "Compte",
      search: "Rechercher",
    },
    common: {
      delivery: "Livraison dans toute la Tunisie",
      cod: "Paiement à la livraison",
      phone: "Confirmation par téléphone",
      shop: "Découvrir la collection",
      addToCart: "Ajouter au panier",
      outOfStock: "Rupture de stock",
      priceFrom: "À partir de",
    },
  },
  en: {
    nav: {
      watches: "Watches",
      wishlist: "Wishlist",
      cart: "Cart",
      account: "Account",
      search: "Search",
    },
    common: {
      delivery: "Delivery throughout Tunisia",
      cod: "Cash on delivery",
      phone: "Confirmation by phone",
      shop: "Explore the collection",
      addToCart: "Add to cart",
      outOfStock: "Out of stock",
      priceFrom: "From",
    },
  },
} as const;

export function t(locale: Locale) {
  return dictionary[locale];
}
