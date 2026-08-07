"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/browser";

export function TrackView({
  productId,
  valueMillimes,
}: {
  productId: string;
  valueMillimes?: number;
}) {
  useEffect(() => {
    track("ViewContent", { productId, valueMillimes });
  }, [productId, valueMillimes]);
  return null;
}

export function TrackOrder({
  orderId,
  orderNumber,
  valueMillimes,
}: {
  orderId: string;
  orderNumber: string;
  valueMillimes: number;
}) {
  useEffect(() => {
    track("OrderPlaced", { orderId, orderNumber, valueMillimes, currency: "TND", eventId: `browser-order-${orderId}` });
  }, [orderId, orderNumber, valueMillimes]);
  return null;
}
