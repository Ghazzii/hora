"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types/cart";
import { MAX_CART_QUANTITY } from "@/lib/constants";
import { track } from "@/lib/analytics/browser";

const STORAGE_KEY = "hora_cart_v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotalMillimes: number;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function restoreCart(raw: string): CartItem[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  return parsed.slice(0, 30).filter((entry): entry is CartItem => {
    if (!entry || typeof entry !== "object") return false;
    const item = entry as Record<string, unknown>;
    const textFields = ["productId", "variantId", "productSlugFr", "productSlugEn", "productNameFr", "productNameEn", "variantLabelFr", "variantLabelEn", "imageUrl"];
    if (textFields.some((key) => typeof item[key] !== "string" || !(item[key] as string).length)) return false;
    if (!Number.isSafeInteger(item.unitPriceMillimes) || (item.unitPriceMillimes as number) < 0) return false;
    if (!Number.isSafeInteger(item.maxStock) || (item.maxStock as number) < 1) return false;
    if (!Number.isSafeInteger(item.quantity) || (item.quantity as number) < 1 || (item.quantity as number) > Math.min(MAX_CART_QUANTITY, item.maxStock as number)) return false;
    if (seen.has(item.variantId as string)) return false;
    seen.add(item.variantId as string);
    return true;
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(restoreCart(stored));
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Keep the in-memory cart. */ }
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((current) => {
        const existing = current.find(
          (entry) => entry.variantId === item.variantId,
        );
        const maximum = Math.min(MAX_CART_QUANTITY, item.maxStock);
        if (existing) {
          return current.map((entry) =>
            entry.variantId === item.variantId
              ? {
                  ...entry,
                  quantity: Math.min(maximum, entry.quantity + quantity),
                  maxStock: item.maxStock,
                  unitPriceMillimes: item.unitPriceMillimes,
                }
              : entry,
          );
        }
        return [
          ...current,
          { ...item, quantity: Math.min(maximum, Math.max(1, quantity)) },
        ];
      });
      track("AddToCart", {
        productId: item.productId,
        variantId: item.variantId,
        valueMillimes: item.unitPriceMillimes,
      });
    },
    [],
  );

  const removeItem = useCallback((variantId: string) => {
    setItems((current) =>
      current.filter((entry) => entry.variantId !== variantId),
    );
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((current) =>
      current.map((entry) =>
        entry.variantId === variantId
          ? {
              ...entry,
              quantity: Math.max(
                1,
                Math.min(entry.maxStock, MAX_CART_QUANTITY, quantity),
              ),
            }
          : entry,
      ),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalMillimes: items.reduce(
        (sum, item) => sum + item.unitPriceMillimes * item.quantity,
        0,
      ),
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clear,
    }),
    [items, hydrated, addItem, removeItem, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
