import type {
  EcommerceEventName,
  EcommerceEventPayload,
} from "@/lib/analytics/types";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(
  name: EcommerceEventName,
  payload: EcommerceEventPayload = {},
) {
  if (typeof window === "undefined") return;
  const eventId = payload.eventId ?? crypto.randomUUID();
  const body = JSON.stringify({ name, payload: { ...payload, eventId } });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics",
      new Blob([body], { type: "application/json" }),
    );
  } else {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  }

  if (window.fbq && process.env.NEXT_PUBLIC_META_PIXEL_ID) {
    window.fbq("track", name, {
      ...payload,
      currency: "TND",
      value:
        typeof payload.valueMillimes === "number"
          ? payload.valueMillimes / 1000
          : undefined,
    }, { eventID: eventId });
  }
}
