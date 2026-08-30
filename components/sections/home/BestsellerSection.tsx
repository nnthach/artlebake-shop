"use client";

import ProductCarousel from "@/components/custom/ProductCarousel";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/I18nContext";
import { useInView } from "@/hooks/useInView";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface FetchedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  image_url: string[];
  is_active: boolean;
}

export default function BestsellerSection() {
  const { ref } = useInView<HTMLDivElement>();
  const { t, locale } = useI18n();
  const [products, setProducts] = useState<FetchedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        is_active: "true",
        limit: "6",
        page: "1",
        locale,
        is_bestseller: "true",
      });
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <section
      id="bestsellers"
      className="relative z-10 bg-sand px-4 py-14 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-7xl text-center">
        <p className="font-script text-3xl text-primary sm:text-4xl">
          {t("homePage.bestSellerSection.badge")}
        </p>
        <h2 className="mt-2 text-3xl font-bold text-charcoal sm:text-4xl whitespace-pre-line">
          {t("homePage.bestSellerSection.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-charcoal/60">
          {t("homePage.bestSellerSection.description")}
        </p>

        <div ref={ref} className="mt-8 sm:mt-14 w-full overflow-hidden">
          {isLoading ? (
            <div className="flex w-max items-center gap-4 px-2 sm:gap-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="
            h-[220px] w-[220px]
            shrink-0
            animate-pulse
            rounded-3xl
            bg-charcoal/10
            sm:h-[280px] sm:w-[280px]
            lg:h-[320px] lg:w-[320px]
          "
                />
              ))}
            </div>
          ) : (
            <ProductCarousel products={products} />
          )}
        </div>

        <div className="mt-8 sm:mt-14">
          <Link href={"/menu"}>
            <Button variant="default" size="lg" className="font-semibold">
              {t("button.exploreMenu")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
