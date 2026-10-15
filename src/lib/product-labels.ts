import type { Locale } from "@/lib/i18n";

/** Catalog gender labels are stored in French, like the admin's suggestions. */
export function genderLabel(value: string, locale: Locale) {
  if (locale === "fr") return value;
  return (
    (
      { Homme: "Men", Femme: "Women", Unisexe: "Unisex" } as Record<
        string,
        string
      >
    )[value] ?? value
  );
}
