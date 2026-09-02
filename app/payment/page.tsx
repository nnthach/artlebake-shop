"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/context/I18nContext";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();

  const orderCode = searchParams.get("orderCode");
  const cancel = searchParams.get("cancel");
  const status = searchParams.get("status");

  useEffect(() => {
    if (!orderCode) {
      router.replace("/order/fail");
      return;
    }

    const handlePayment = async () => {
      // PayOS user cancelled payment
      if (cancel === "true" || status === "CANCELLED") {
        try {
          const res = await fetch("/api/order/cancel-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderCode,
            }),
          });

          const data = await res.json();

          if (!data.success) {
            console.error("Cancel payment failed:", data.error);
          }
        } catch (error) {
          console.error("Cancel payment error:", error);
        } finally {
          router.replace(`/order/fail?orderCode=${orderCode}`);
        }

        return;
      }

      // Check payment status
      const checkPayment = async () => {
        try {
          const res = await fetch(
            `/api/order/payment-status?orderCode=${orderCode}`,
          );

          const data = await res.json();

          if (!data.success) {
            router.replace("/order/fail");
            return;
          }

          switch (data.data.status) {
            case "paid":
              router.replace(`/order/success?orderId=${data.data.order_id}`);
              break;

            case "failed":
            case "cancelled":
              router.replace(`/order/fail?orderId=${data.data.order_id}`);
              break;

            default:
              // pending → check again after 2 seconds
              setTimeout(checkPayment, 2000);
          }
        } catch (error) {
          console.error("Check payment error:", error);
          router.replace("/order/fail");
        }
      };

      checkPayment();
    };

    handlePayment();
  }, [orderCode, cancel, status, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {locale === "en"
            ? "Confirming Payment..."
            : "Đang xác nhận thanh toán..."}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {locale === "en"
            ? "Please wait a moment."
            : "Vui lòng đợi trong giây lát."}
        </p>
      </div>
    </div>
  );
}
