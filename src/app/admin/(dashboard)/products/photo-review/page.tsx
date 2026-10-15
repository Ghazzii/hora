import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import catalog from "../../../../../../data/watch-catalog.json";

export const metadata = { title: "Watch photo review" };

export default function PhotoReviewPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog photography"
        title="The watches, in detail."
        description={`${catalog.products.length} watches · Four images each · Compare with the original before publishing.`}
        actions={
          <Link
            href="/admin/products?q=HP-"
            className="btn h-11 border border-ink/15 bg-white px-5 text-sm"
          >
            <ArrowLeft size={16} /> Products
          </Link>
        }
      />
      <p className="mt-6 max-w-3xl text-sm leading-6 text-ink/60">
        Each finish has its own gallery. Check the dial, case, bracelet and
        lettering against the original. Prices and stock are example values; you
        can edit them in Products. Select a photo to inspect it at full size.
      </p>
      <div className="mt-8 space-y-8">
        {catalog.products.map((product, productIndex) => (
          <section
            key={product.sku}
            className="admin-card overflow-hidden p-4 sm:p-6"
            aria-labelledby={`watch-${product.slug}`}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-ink/45">
                  {String(productIndex + 1).padStart(2, "0")} / {product.brand}
                </p>
                <h2
                  id={`watch-${product.slug}`}
                  className="mt-1 font-display text-2xl"
                >
                  {product.nameEn}
                </h2>
                <p className="mt-1 text-xs text-ink/45">
                  Source photos{" "}
                  {product.sources.map((source) => source.id).join(", ")}
                </p>
              </div>
              <Link
                href={`/admin/products?q=${encodeURIComponent(product.sku)}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-gold-dark"
              >
                Edit product <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {[
                {
                  url: product.reference,
                  altEn: `${product.nameEn} — original photo`,
                },
                ...product.images,
              ].map((photo, index) => (
                <figure key={photo.url}>
                  <a
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-sand outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                    aria-label={`Inspect ${photo.altEn}`}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.altEn}
                      fill
                      sizes="(max-width: 640px) 44vw, (max-width: 1280px) 28vw, 16vw"
                      className="object-contain"
                    />
                  </a>
                  <figcaption className="mt-2 text-xs text-ink/60">
                    {
                      [
                        "Original",
                        "01 / Studio",
                        "02 / Angle",
                        "03 / Dial detail",
                        "04 / Editorial",
                      ][index]
                    }
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
