import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useI18n } from "@/context/I18nContext";

type ProductCardMobileProps = {
  product: {
    id: string;
    image: string;
    name: string;
    description: string;
    price: string;
    status: string;
  };
};

export default function ProductCardMobile({ product }: ProductCardMobileProps) {
  const { t, locale } = useI18n();

  return (
    <div className="group flex gap-4 rounded-2xl bg-white p-3 shadow-sm transition-all duration-300 active:scale-[0.99]">
      {/* Product Image */}
      <Link
        href={`/menu/${product.id}`}
        className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {product.status === "out_of_stock" && (
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal/40">
            <span className="text-xs font-medium text-white">
              {t("menuPage.productStatus.out_of_stock")}
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <Link href={`/menu/${product.id}`}>
          <h3 className="truncate font-serif text-lg italic text-charcoal">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-charcoal/55">
          {product.description}
        </p>

        {/* Bottom */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-base font-bold text-charcoal">
            {product.price}
          </span>

          <button
            type="button"
            disabled={product.status === "out_of_stock"}
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
