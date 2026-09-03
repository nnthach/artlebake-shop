import { CalendarClock, PackageCheck } from "lucide-react";

import { useI18n } from "@/context/I18nContext";
import { cn } from "@/utils/format-sth";

interface OrderTypeSelectProps {
  orderType: "available" | "preorder";
  onChange: (value: "available" | "preorder") => void;
  isSubmitting?: boolean;
}

export default function OrderTypeSelect({
  orderType,
  onChange,
  isSubmitting = false,
}: OrderTypeSelectProps) {
  const { locale } = useI18n();

  return (
    <section className="p-0">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
        {locale === "vi" ? "Hình thức đặt hàng" : "Order type"}
      </h2>

      <p className="mt-1 text-xs text-charcoal/50">
        {locale === "vi"
          ? "Một số sản phẩm trong giỏ có thể nhận ngay hoặc đặt trước."
          : "Some products in your cart are available now or can be pre-ordered."}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onChange("available")}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4 text-left transition",
            orderType === "available"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-charcoal/10 hover:border-charcoal/20",
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              orderType === "available"
                ? "bg-primary text-white"
                : "bg-charcoal/5 text-charcoal/50",
            )}
          >
            <PackageCheck className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-charcoal">
              {locale === "vi" ? "Có sẵn" : "Available"}
            </p>

            <p className="mt-1 text-xs text-charcoal/50">
              {locale === "vi"
                ? "Nhận bánh trong ngày"
                : "Receive available products"}
            </p>
          </div>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onChange("preorder")}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4 text-left transition",
            orderType === "preorder"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-charcoal/10 hover:border-charcoal/20",
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              orderType === "preorder"
                ? "bg-primary text-white"
                : "bg-charcoal/5 text-charcoal/50",
            )}
          >
            <CalendarClock className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-charcoal">
              {locale === "vi" ? "Đặt trước" : "Pre-order"}
            </p>

            <p className="mt-1 text-xs text-charcoal/50">
              {locale === "vi"
                ? "Chọn ngày nhận bánh"
                : "Choose your preferred date"}
            </p>
          </div>
        </button>
      </div>
    </section>
  );
}

