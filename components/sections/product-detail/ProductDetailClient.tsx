"use client";

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/custom/ProductCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/format-sth";
import { FetchedProductMenu, ProductDetailPage } from "@/types";
import { ChevronLeft, ShoppingCart, Wheat } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ProductDetailClient({
  params,
}: {
  params: { slug: string };
}) {
  const { t, locale } = useI18n();
  const { addItem } = useCart();

  const router = useRouter();

  const [product, setProduct] = useState<ProductDetailPage | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<FetchedProductMenu[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/products/${params.slug}?locale=${locale}`);
      if (res.status === 404) {
        setNotFoundError(true);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.slug, locale]);

  const fetchRelatedProducts = useCallback(
    async (categoryId: string, currentId: string) => {
      try {
        const query = new URLSearchParams({
          is_active: "true",
          locale,
          category_id: categoryId,
        });
        const res = await fetch(`/api/products/menu?${query.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const related: FetchedProductMenu[] = data.data
            .filter((p: { id: string }) => p.id !== currentId)
            .slice(0, 3);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Failed to fetch related products:", error);
      }
    },
    [locale],
  );

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product?.category?.id) {
      fetchRelatedProducts(product.category.id, product.id);
    }
  }, [product?.category?.id, product?.id, fetchRelatedProducts]);

  if (notFoundError) notFound();

  if (isLoading) {
    return (
      <div className="bg-sand">
        <Header />
        <section className="relative h-64 animate-pulse bg-charcoal/10" />
        <section className="px-6 py-14">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="mx-auto h-96 w-full max-w-md animate-pulse rounded-2xl bg-charcoal/10" />
            <div className="mx-auto h-6 w-32 animate-pulse rounded bg-charcoal/10" />
            <div className="mx-auto h-4 w-64 animate-pulse rounded bg-charcoal/10" />
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!product) {
    toast.error(
      locale === "en" ? "Product not found" : "Không tìm thấy sản phẩm",
    );

    router.back();

    return null;
  }

  const addToCartButton = async () => {
    setIsAdding(true);
    await addItem({
      id: product.id,
      name: product?.name || "",
      slug: product.slug || "",
      price: product.price,
      image_url: product.image_url[0],
      available: product.daily.available,
      preorder: product.preorder.available,
    });
    setIsAdding(false);
  };

  // format
  const image = product.image_url?.[0] ?? "/images/placeholder.webp";
  const categoryName = product.category?.name?.[locale as "en" | "vi"] ?? "";
  const formattedPrice = product.price.toLocaleString("vi-VN") + " đ";

  // Status
  const hasDaily = product.daily?.available ?? false;
  const hasPreorder = product.preorder?.available ?? false;
  const isOutOfStock = !hasDaily && !hasPreorder;
  return (
    <div className="bg-sand">
      <Header />

      {/* Hero banner */}
      <section className="relative overflow-hidden bg-charcoal-900 px-6 pb-8 pt-28">
        <Image
          src={image}
          alt={product?.name || ""}
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/75 via-charcoal-900/55 to-charcoal-900/85" />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1 text-sm font-semibold text-white/70 transition hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" /> {t("button.backToMenu")}
          </Link>
          {categoryName && (
            <p className="mt-4 font-script text-3xl text-primary">
              {categoryName}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            {product.name}
          </h1>
        </div>
      </section>

      {/* Product detail */}
      <section className="relative z-10 px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-md sm:h-96">
            <Image
              src={image}
              alt={product?.name || ""}
              fill
              priority
              className="object-cover"
            />
          </div>

          <p className="mt-8 text-xl sm:text-2xl font-bold text-primary">
            {formattedPrice}
          </p>
          <p className="mx-auto mt-4 max-w-md text-charcoal/60 text-sm sm:text-base">
            {product.description}
          </p>

          {product.ingredients.length > 0 && (
            <div className="mx-auto mt-10 max-w-sm text-left">
              <h2 className="flex items-center gap-2 font-serif text-base sm:text-lg font-bold text-charcoal">
                <Wheat className="h-4 w-4 text-primary" />
                {t("productDetailPage.ingredients")}
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-charcoal/60">
                {product.ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {ingredient.name?.[locale as "en" | "vi"] ??
                      ingredient.name.vi}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Button */}
          <div className="mt-10 flex flex-col items-center gap-3">
            {/* Product status */}
            <div className="flex items-center gap-2">
              {hasDaily && (
                <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-white">
                  {t("menuPage.productStatus.available")}
                </span>
              )}

              {hasPreorder && (
                <span className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-medium text-white">
                  {t("menuPage.productStatus.preorder")}
                </span>
              )}
            </div>

            <Button
              variant={isOutOfStock ? "secondary" : "default"}
              className={cn(
                "h-10 rounded-full px-5 !text-sm font-semibold sm:h-11 sm:px-8 sm:!text-base",
                isOutOfStock &&
                  "cursor-not-allowed bg-charcoal/10 text-charcoal/40 hover:bg-charcoal/10",
              )}
              disabled={isAdding || isOutOfStock}
              onClick={addToCartButton}
            >
              {!isOutOfStock && (
                <ShoppingCart className="h-5 w-5 sm:h-5 sm:w-5" />
              )}
              {isOutOfStock
                ? t("menuPage.productStatus.out_of_stock")
                : t("button.addToCart")}
            </Button>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="relative z-10 bg-white px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-center font-script text-2xl text-primary">
              {t("productDetailPage.youMightAlsoLike")}
            </p>
            <div className="mt-10 flex gap-5 overflow-x-auto px-1 pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none lg:grid-cols-3">
              {relatedProducts.map((item) => (
                <div
                  key={item.id}
                  className="w-[280px] shrink-0 snap-start sm:w-auto"
                >
                  <ProductCard
                    product={{
                      id: item.slug,
                      image: item.image_url?.[0] ?? "/images/placeholder.webp",
                      name: item.name,
                      description: item.description,
                      slug: item.slug,
                      price: item.price,
                      daily: item.daily,
                      preorder: item.preorder,
                    }}
                    animation={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
