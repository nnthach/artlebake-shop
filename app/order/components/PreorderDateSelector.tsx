"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/context/I18nContext";
import { useEffect, useState } from "react";

interface PreorderDateSelectorProps {
  productIds: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

interface PreorderDate {
  schedule_id: string;
  date: string;
}

interface PreorderDateResponse {
  data: PreorderDate[];
}

export default function PreorderDateSelector({
  productIds,
  value,
  onChange,
  disabled = false,
}: PreorderDateSelectorProps) {
  const { locale } = useI18n();

  const [dates, setDates] = useState<PreorderDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dùng string để tránh trường hợp parent tạo array mới
  // nhưng nội dung productIds không thay đổi.
  const productIdsKey = productIds.join(",");

  useEffect(() => {
    if (productIds.length === 0) {
      setDates([]);
      return;
    }

    const fetchAvailableDates = async () => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();

        productIds.forEach((id) => {
          params.append("product_ids", id);
        });

        const res = await fetch(
          `/api/preorder-items/available-dates?${params.toString()}`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch preorder dates");
        }

        const result: PreorderDateResponse = await res.json();

        setDates(result.data);
      } catch (error) {
        console.error("Failed to fetch preorder dates:", error);
        setDates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableDates();
  }, [productIdsKey]);

  // Chỉ reset value nếu ngày hiện tại không còn hợp lệ.
  // Effect này KHÔNG fetch API.
  useEffect(() => {
    if (
      value &&
      dates.length > 0 &&
      !dates.some((item) => item.schedule_id === value)
    ) {
      onChange("");
    }
  }, [dates, value, onChange]);

  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day);
  };

  const getDayName = (date: Date) => {
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      weekday: "short",
    }).format(date);
  };

  const getDayNumber = (date: Date) => {
    return date.getDate();
  };

  const getMonth = (date: Date) => {
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      month: "short",
    }).format(date);
  };

  return (
    <section className="">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
        {locale === "vi" ? "Ngày nhận bánh" : "Pickup date"}
      </h2>
      <p className="mt-1 text-xs text-charcoal/50">
        {locale === "vi"
          ? "Một số sản phẩm trong giỏ hiện chưa có sẵn. Vui lòng chọn ngày đặt trước để nhận đầy đủ đơn hàng."
          : "Some items in your cart are currently unavailable. Please choose a pre-order date to receive your complete order."}
      </p>

      {isLoading ? (
        <div className="mt-4 flex items-center justify-center py-6 text-sm text-charcoal/50">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />

          {locale === "vi"
            ? "Đang tải ngày nhận bánh..."
            : "Loading available dates..."}
        </div>
      ) : dates.length === 0 ? (
        <div className="mt-4 rounded-xl bg-charcoal/5 px-4 py-3 text-sm text-charcoal/50">
          {locale === "vi"
            ? "Không có ngày nhận phù hợp cho các sản phẩm trong giỏ hàng."
            : "No available date for the products in your cart."}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {dates.map((item) => {
            const date = parseDate(item.date);
            const selected = value === item.schedule_id;

            return (
              <button
                key={item.schedule_id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(item.schedule_id)}
                className={cn(
                  "flex flex-col items-center rounded-xl border px-2 py-3 transition",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-charcoal/10 bg-white text-charcoal hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                <span className="text-[11px] font-medium uppercase text-black">
                  {getDayName(date)}
                </span>

                <span className="mt-1 text-xl font-bold text-black">
                  {getDayNumber(date)}
                </span>

                <span className="text-[11px] text-black">{getMonth(date)}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
