"use client";

import { useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string; alt: string };

export function ProductGallery({ images, name, locale }: { images: GalleryImage[]; name: string; locale: "fr" | "en" }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const french = locale === "fr";
  const list = images.length ? images : [{ id: "placeholder", url: "/images/watch-1.svg", alt: name }];

  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setZoom({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  };

  const scrollTo = (index: number) => {
    const node = track.current;
    if (node) node.scrollTo({ left: node.clientWidth * index, behavior: "smooth" });
  };

  return (
    <div className={cn(list.length > 1 && "lg:grid lg:grid-cols-[84px_1fr] lg:gap-4")}>
      {/* Desktop thumbnails */}
      {list.length > 1 && (
        <div className="hidden flex-col gap-3 lg:flex" role="tablist" aria-label={french ? "Photos du produit" : "Product photos"}>
          {list.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={french ? `Photo ${index + 1}` : `Photo ${index + 1}`}
              onClick={() => setActive(index)}
              className={cn(
                "relative aspect-[4/5] overflow-hidden rounded-xl bg-sand ring-offset-2 ring-offset-ivory transition duration-300",
                index === active ? "ring-2 ring-ink" : "opacity-60 hover:opacity-100",
              )}
            >
              <Image src={image.url} alt="" fill sizes="84px" className="object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* Desktop main image with cursor-following zoom */}
      <div
        className="relative hidden aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[1.75rem] bg-sand lg:block"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
      >
        {list.map((image, index) => (
          <Image
            key={image.id}
            src={image.url}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className={cn(
              "object-contain transition-[opacity,transform] duration-700 ease-out",
              index === active ? "opacity-100" : "opacity-0",
              index === active && zoom ? "scale-[1.8]" : "scale-100",
            )}
            style={index === active && zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        ))}
      </div>

      {/* Mobile swipe track */}
      <div className="relative -mx-4 sm:mx-0 lg:hidden">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-[1.75rem]"
          onScroll={(event) => {
            const node = event.currentTarget;
            setActive(Math.round(node.scrollLeft / Math.max(1, node.clientWidth)));
          }}
        >
          {list.map((image, index) => (
            <div key={image.id} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-sand">
              <Image src={image.url} alt={image.alt} fill priority={index === 0} sizes="100vw" className="object-contain" />
            </div>
          ))}
        </div>
        {list.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {list.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={french ? `Voir la photo ${index + 1}` : `Show photo ${index + 1}`}
                className={cn("h-1.5 rounded-full bg-ink transition-all duration-300", index === active ? "w-6" : "w-1.5 opacity-30")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
