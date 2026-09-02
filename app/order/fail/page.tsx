"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle, RefreshCw, ShoppingBag } from "lucide-react";

import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/I18nContext";

function OrderFailContent() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode");

  return (
    <div className="flex min-h-screen flex-col bg-sand pb-12">
      <Header forceScrolled />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 pt-24 lg:pt-28">
        {/* Header Thông báo Thất bại */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-destructive">
            <XCircle className="h-10 w-10" />
          </div>

          <h1 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-charcoal">
            {t("orderPage.result.fail.title")}
          </h1>

          <p className="mt-1 text-xs sm:text-sm text-charcoal/60 leading-relaxed">
            {locale === "en"
              ? "We couldn't process your payment. Please try again."
              : "Chúng tôi không thể xử lý thanh toán của bạn. Vui lòng thử lại."}
          </p>

          {orderCode && (
            <p className="mt-2 text-xs sm:text-sm font-semibold text-charcoal/50">
              {locale === "vi" ? "Mã đơn hàng:" : "Order Code:"}{" "}
              <span className="font-mono text-charcoal font-bold">
                #{orderCode}
              </span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/order" className="w-full sm:w-auto">
            <Button
              variant="default"
              className="h-11 w-full rounded-full px-6 text-xs sm:text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("orderPage.result.tryAgain")}
            </Button>
          </Link>

          <Link href="/menu" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="h-11 w-full rounded-full border-charcoal/15 px-6 text-xs sm:text-sm font-semibold hover:border-primary/50 hover:text-primary flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("orderPage.result.backToMenu")}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function OrderFailPage() {
  return (
    <Suspense fallback={null}>
      <OrderFailContent />
    </Suspense>
  );
}
