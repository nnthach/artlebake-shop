"use client";

import { Clock, MapPin, Phone } from "lucide-react";

import { useI18n } from "@/context/I18nContext";

export default function StoreAddress() {
  const { locale } = useI18n();

  return (
    <section className="">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
        {locale === "vi" ? "Địa chỉ nhận hàng" : "Pickup location"}
      </h2>

      <div className="mt-4 rounded-xl bg-sand-100 p-4">
        <div className="flex gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-charcoal">Artle Bakeshop</p>

            <div className="mt-2 space-y-2 text-sm text-charcoal/60">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                <span>
                  {locale === "vi"
                    ? "331 Bến Vân Đồn, Phường Vĩnh Hội, Quận 4, TP Hồ Chí Minh"
                    : "331 Ben Van Don, Vinh Hoi Ward, District 4, Ho Chi Minh City"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />

                <span>0909 123 456</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />{" "}
                {locale === "vi"
                  ? "Mở cửa hàng ngày: 8:00 - 20:00"
                  : "Open Daily: 8:00 AM – 8:00 PM"}{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
