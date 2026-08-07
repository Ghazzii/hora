export type EcommerceEventName =
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "InitiateCheckout"
  | "OrderPlaced";

export type EcommerceEventPayload = {
  eventId?: string;
  productId?: string;
  variantId?: string;
  searchQuery?: string;
  orderId?: string;
  orderNumber?: string;
  valueMillimes?: number;
  currency?: "TND";
  [key: string]: unknown;
};

export type AnalyticsProvider = {
  track: (
    name: EcommerceEventName,
    payload: EcommerceEventPayload,
  ) => void | Promise<void>;
};
