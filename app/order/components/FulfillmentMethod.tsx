import { MapPin, Store } from "lucide-react";

import { useI18n } from "@/context/I18nContext";
import { cn } from "@/utils/format-sth";

interface FulfillmentMethodProps {
  fulfillmentMethod: "delivery" | "pickup";
  onChange: (value: "delivery" | "pickup") => void;
  isSubmitting?: boolean;
}

export default function FulfillmentMethod({
  fulfillmentMethod,
  onChange,
  isSubmitting = false,
}: FulfillmentMethodProps) {
  const { locale } = useI18n();

  return (
    <section className="p-0">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
        {locale === "vi" ? "Phương thức nhận hàng" : "Fulfillment method"}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onChange("delivery")}
          className={cn(
            "flex items-center gap-2 rounded-xl border p-3 text-left transition sm:gap-3 sm:p-4",
            fulfillmentMethod === "delivery"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-charcoal/10 hover:border-charcoal/20",
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8",
              fulfillmentMethod === "delivery"
                ? "bg-primary text-white"
                : "bg-charcoal/5 text-charcoal/50",
            )}
          >
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <p className="text-sm font-semibold text-charcoal sm:text-base">
            {locale === "vi" ? "Giao hàng" : "Delivery"}
          </p>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onChange("pickup")}
          className={cn(
            "flex items-center gap-2 rounded-xl border p-3 text-left transition sm:gap-3 sm:p-4",
            fulfillmentMethod === "pickup"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-charcoal/10 hover:border-charcoal/20",
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8",
              fulfillmentMethod === "pickup"
                ? "bg-primary text-white"
                : "bg-charcoal/5 text-charcoal/50",
            )}
          >
            <Store className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <p className="text-sm font-semibold text-charcoal sm:text-base">
            {locale === "vi" ? "Đến lấy" : "Pickup"}
          </p>
        </button>
      </div>
    </section>
  );
}
