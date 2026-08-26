"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/context/I18nContext";
import { BakeryProduct } from "@/types";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";

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
  return (
    <div
      style={animation ? { animationDelay: `${index * 80}ms` } : undefined}
      className={`group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        animation
          ? inView
            ? "animate-fadeUp opacity-100"
            : "opacity-0 translate-y-6"
          : ""
      }`}
    >
      <Link href={`/menu/${product.id}`}>
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.status === "out_of_stock" && (
            <Badge
              variant="outline"
              className="absolute left-3 top-3 border-transparent bg-charcoal/40 text-white"
            >
              {t("menuPage.productStatus.out_of_stock")}
            </Badge>
          )}
        </div>
      </Link>
      <div className="p-6">
        <Link href={`/menu/${product.id}`}>
          <h3 className="font-serif text-xl italic text-charcoal">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-sm text-charcoal/55">{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-charcoal">
            {product.price}
          </span>
          <Button
            type="button"
            disabled={product.status === "out_of_stock"}
            className="rounded-2xl"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{locale === "en" ? "Add" : "Thêm"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
