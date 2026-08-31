"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/context/I18nContext";
import { BakeryProduct } from "@/types";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: BakeryProduct;
  index?: number;
  animation: boolean;
  inView?: boolean;
}

export default function ProductCard({
  product,
  index = 0,
  inView,
  animation,
}: ProductCardProps) {
  const { t, locale } = useI18n();
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const hasDaily = (product.daily?.remaining_quantity ?? 0) > 0;
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
    <div
      style={animation ? { animationDelay: `${index * 80}ms` } : undefined}
      className={`group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        animation
          ? inView
            ? "animate-fadeUp opacity-100"
            : "translate-y-6 opacity-0"
          : ""
      }`}
    >
      <Link href={`/menu/${product.id}`}>
        <div className="relative h-72 w-full overflow-hidden">
          <Image
            src={product?.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Product status */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {hasDaily ? (
              <Badge
                variant="outline"
                className="border-transparent bg-primary/90 text-white"
              >
                {t("menuPage.productStatus.available")}
              </Badge>
            ) : hasPreorder ? (
              <Badge
                variant="outline"
                className="border-transparent bg-amber-500/90 text-white"
              >
                {t("menuPage.productStatus.preorder")}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-transparent bg-charcoal/40 text-white"
              >
                {t("menuPage.productStatus.out_of_stock")}
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/menu/${product.id}`}>
          <h3 className="font-serif text-xl text-charcoal">{product.name}</h3>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm text-charcoal/55">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-charcoal">
            {product.price.toLocaleString("vi-VN")} đ
          </span>

          <Button
            type="button"
            disabled={!isAvailable || isAdding}
            onClick={() => addToCartButton(product)}
            size={"sm"}
            className="rounded-2xl"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{locale === "en" ? "Add" : "Thêm"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
