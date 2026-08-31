"use client";

import { MapPin, Phone, Store } from "lucide-react";

import { useI18n } from "@/context/I18nContext";

export default function StoreAddress() {
  const { locale } = useI18n();

  return (
    <section className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal/50">
        {locale === "vi" ? "Địa chỉ nhận hàng" : "Pickup location"}
      </h2>

      <div className="mt-4 rounded-xl bg-charcoal/5 p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Store className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-charcoal">Duotech Bakery</p>

            <div className="mt-2 space-y-2 text-sm text-charcoal/60">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />

                <span>
                  {locale === "vi"
                    ? "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh"
                    : "123 ABC Street, XYZ District, Ho Chi Minh City"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />

                <span>0909 123 456</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
