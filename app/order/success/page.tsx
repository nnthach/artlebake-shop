"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Calendar, Mail, Phone, User } from "lucide-react";

import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/I18nContext";
import { useCart } from "@/context/CartContext";

interface OrderItemDetail {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  products?: {
    image_url?: string[];
  };
}

interface PreorderSchedule {
  id: string;
  date: string;
  status: boolean;
}

interface OrderDetail {
  id: string;
  order_code: string;
  name: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  district: string | null;
  ward: string | null;
  note: string | null;
  fulfillment_method: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  order_items: OrderItemDetail[];
  preorder_schedules?: PreorderSchedule | null;
}

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + " đ";

function OrderSuccessContent() {
  const { t, locale } = useI18n();
  const { clearCart } = useCart();

  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/order/${orderId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
          clearCart();
        }
      } catch (error) {
        console.error("Fetch order detail error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-sand pb-12">
      <Header forceScrolled />

      <main className="mx-auto max-w-xl px-4 pt-24 lg:pt-28">
        {/* Header Thông báo Thành công */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-charcoal">
            {t("orderPage.result.success.title")}
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {t("orderPage.result.success.message")}
          </p>
          {order && (
            <p className="mt-2 text-xs font-semibold text-charcoal/40">
              {t("orderPage.result.orderNumber").replace(
                "{id}",
                order.order_code || order.id,
              )}
            </p>
          )}
        </div>

        {/* Nội dung chi tiết đơn hàng */}
        {isLoading ? (
          <div className="mt-8 flex items-center justify-center rounded-2xl border border-charcoal/10 bg-white p-12 text-sm text-charcoal/50 shadow-sm">
            {t("orderPage.result.loading")}
          </div>
        ) : (
          order && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
              {/* Customer Information */}
              <section className="border-b border-charcoal/10 pb-6">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider ">
                  {locale === "vi"
                    ? "Thông tin khách hàng"
                    : "Customer Information"}
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2.5 text-sm sm:text-base text-charcoal">
                    <User className="h-4 w-4 shrink-0 text-charcoal/40" />
                    <span className="font-medium">{order.name}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm sm:text-base text-charcoal">
                    <Phone className="h-4 w-4 shrink-0 text-charcoal/40" />
                    <span>{order.phone}</span>
                  </div>

                  {order.email && (
                    <div className="flex items-center gap-2.5 text-sm sm:text-base text-charcoal sm:col-span-2">
                      <Mail className="h-4 w-4 shrink-0 text-charcoal/40" />
                      <span className="truncate">{order.email}</span>
                    </div>
                  )}

                  {order.preorder_schedules?.date && (
                    <div className="flex items-center gap-2.5 text-sm sm:text-base text-charcoal sm:col-span-2">
                      <Calendar className="h-4 w-4 shrink-0 text-charcoal/40" />
                      <span>
                        {locale === "vi"
                          ? "Ngày nhận hàng:"
                          : "Pre-order Date:"}{" "}
                        {order.preorder_schedules.date} (
                        {order.fulfillment_method === "delivery"
                          ? locale === "en"
                            ? "Delivery"
                            : "Giao hàng tận nơi"
                          : locale === "en"
                            ? "Pickup"
                            : "Nhận tại cửa hàng"}
                        )
                      </span>
                    </div>
                  )}
                </div>

                {order.note && (
                  <p className="mt-3 rounded-lg bg-sand/50 p-2.5 text-xs sm:text-sm text-charcoal/60">
                    <span className="font-semibold">
                      {locale === "vi" ? "Ghi chú:" : "Note:"}
                    </span>{" "}
                    {order.note}
                  </p>
                )}
              </section>

              {/* Order Items */}
              <section className="mt-6">
                {(() => {
                  const totalQuantity = order.order_items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );

                  return (
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                      {t("orderPage.result.items")} ({totalQuantity})
                    </h3>
                  );
                })()}

                <div className="mt-4 divide-y divide-charcoal/10">
                  {order.order_items.map((item) => {
                    const imageUrl = item.products?.image_url?.[0];

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3.5">
                          {imageUrl ? (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-charcoal/10 bg-sand">
                              <Image
                                src={imageUrl}
                                alt={item.product_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-14 w-14 shrink-0 rounded-xl bg-sand/60" />
                          )}

                          <div>
                            <p className="text-sm sm:text-base font-semibold text-charcoal">
                              {item.product_name}
                            </p>
                            <p className="mt-0.5 text-xs sm:text-sm text-charcoal/50">
                              {formatPrice(item.unit_price)} × {item.quantity}
                            </p>
                          </div>
                        </div>

                        <span className="text-sm sm:text-base font-semibold text-charcoal">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Order Summary / Totals */}
              <section className="mt-6 border-t border-charcoal/10 pt-4 space-y-2.5 text-sm sm:text-base">
                <div className="flex items-center justify-between text-charcoal/70">
                  <span>{t("orderPage.summary.subtotal")}</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-charcoal/70">
                  <span>{t("orderPage.summary.shippingFee")}</span>
                  <span>
                    {order.shipping_fee === 0
                      ? "-"
                      : formatPrice(order.shipping_fee)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-charcoal/15 pt-3.5 text-base sm:text-lg font-bold text-charcoal">
                  <span>{t("orderPage.summary.total")}</span>
                  <span className="text-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </section>
            </div>
          )
        )}

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <Link href="/menu">
            <Button
              variant="default"
              className="h-11 rounded-full px-8 font-semibold shadow-sm"
            >
              {locale === "vi" ? "Quay lại menu" : "Back to Menu"}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}
