import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** A watch's option name for shoppers; null for "Standard", the name of a watch's only option. */
export function optionLabel(label: string) {
  return label.trim().toLowerCase() === "standard" ? null : label;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Only same-site paths may be used as post-login destinations. */
export function safeRedirect(value: string | string[] | undefined, fallback: string) {
  const path = Array.isArray(value) ? value[0] : value;
  return path && /^\/(?![/\\])[\w\-./?=&%]*$/.test(path) ? path : fallback;
}
