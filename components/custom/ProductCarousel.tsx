"use client";

import Image from "next/image";
import Link from "next/link";

import { useInView } from "@/hooks/useInView";
import { useI18n } from "@/context/I18nContext";
import { cn } from "@/utils/format-sth";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  image_url: string[];
  is_active: boolean;
}

type ProductCarouselProps = {
  products: Product[];
};

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const { locale } = useI18n();

  if (!products.length) return null;

  // Duplicate để marquee chạy liên tục
  const marqueeProducts = [...products, ...products];

  return (
    <div
      ref={ref}
      className={cn(
        "w-full overflow-hidden py-6",
        !inView && "opacity-0",
        inView && "animate-fadeUp",
      )}
    >
      <div className="animate-marquee hover:paused flex w-max items-center gap-4 px-2 sm:gap-6">
        {marqueeProducts.map((product, index) => (
          <Link
            key={`${product.id}-${index}`}
            href={`/menu/${product.slug}`}
            className="
              group relative
              h-[220px] w-[220px]
              shrink-0 overflow-hidden rounded-3xl
              transition-transform duration-500
              hover:scale-[1.03]
              sm:h-[280px] sm:w-[280px]
              lg:h-[320px] lg:w-[320px]
            "
          >
            <Image
              src={product.image_url?.[0] ?? "/images/placeholder.webp"}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 280px, 220px"
              className="
                object-cover
                transition-transform duration-700
                group-hover:scale-105
              "
            />

            {/* Overlay */}
            <div
              className="
                absolute inset-0
                bg-linear-to-t
                from-black/80 via-black/10 to-transparent
                transition-all duration-500
                group-hover:from-black/90
                group-hover:via-black/40
              "
            />

            {/* Content */}
            <div
              className="
                absolute inset-x-0 bottom-0
                flex flex-col
                p-5 text-white
                transition-all duration-500
                sm:p-6
              "
            >
              <h3 className="font-serif text-xl italic sm:text-2xl">
                {product.name}
              </h3>

              <p
                className="
                  mt-1 line-clamp-2
                  text-sm text-white/80
                "
              >
                {product.description}
              </p>

              <span
                className="
                  mt-3
                  text-xs font-semibold
                  uppercase tracking-wider
                  opacity-0
                  translate-y-2
                  transition-all duration-500
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                {locale === "vi" ? "Chi tiết" : "View"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
