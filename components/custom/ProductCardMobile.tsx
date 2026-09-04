"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { BakeryProduct } from "@/types";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

type ProductCardMobileProps = {
  product: BakeryProduct;
};

export default function ProductCardMobile({ product }: ProductCardMobileProps) {
  const { t, locale } = useI18n();
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const hasDaily = product.daily?.available ?? false;
  const hasPreorder = product.preorder?.available ?? false;
  const isAvailable = hasDaily || hasPreorder;

  const addToCartButton = async (product: BakeryProduct) => {
    setIsAdding(true);
    await addItem({
      id: product.id,
      name: product?.name || "",
      slug: product.slug || "",
      price: product.price,
      image_url: product.image,
      available: product.daily.available,
      preorder: product.preorder.available,
    });
    setIsAdding(false);
  };

  return (
    <div className="group flex gap-4 rounded-2xl bg-white p-3 shadow-sm transition-all duration-300 active:scale-[0.99]">
      {/* Product Image */}
      <Link
        href={`/menu/${product.slug}`}
        className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Status */}
        <div className="absolute left-2 top-0">
          {hasDaily ? (
            <span className="rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-white">
              {t("menuPage.productStatus.available")}
            </span>
          ) : hasPreorder ? (
            <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
              {t("menuPage.productStatus.preorder")}
            </span>
          ) : (
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
              {t("menuPage.productStatus.out_of_stock")}
            </span>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <Link href={`/menu/${product.slug}`}>
          <h3 className="truncate font-serif text-base text-charcoal">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-charcoal/55">
          {product.description}
        </p>

        {/* Bottom */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-sm font-bold text-charcoal">
            {product.price.toLocaleString("vi-VN")} đ
          </span>

          <button
            type="button"
            disabled={!isAvailable || isAdding}
            onClick={() => addToCartButton(product)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{locale === "en" ? "Add" : "Thêm"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
