import { z } from "zod";
import {
  MAX_CART_QUANTITY,
  TUNISIAN_GOVERNORATES,
} from "@/lib/constants";
import { isTunisianPhone } from "@/lib/phone";

export const checkoutItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(16).max(100),
  locale: z.enum(["fr", "en"]).default("fr"),
  customerFirstName: z.string().trim().min(2).max(80),
  customerLastName: z.string().trim().min(2).max(80),
  customerEmail: z.union([z.string().trim().email().max(160), z.literal("")]).optional(),
  phone: z.string().trim().refine(isTunisianPhone, "Invalid Tunisian phone number"),
  governorate: z.enum(TUNISIAN_GOVERNORATES),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().regex(/^\d{4}$/, "Postal code must contain 4 digits"),
  addressLine1: z.string().trim().min(5).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  deliveryInstructions: z.string().trim().max(500).optional(),
  customerNotes: z.string().trim().max(500).optional(),
  codAccepted: z.literal(true),
  items: z.array(checkoutItemSchema).min(1).max(30),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(200),
});

export const registerSchema = loginSchema.extend({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().refine(isTunisianPhone, "Invalid Tunisian phone number"),
});

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(100),
  body: z.string().trim().min(10).max(1500),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
