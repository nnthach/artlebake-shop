import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/context/I18nContext";
import { Info } from "lucide-react";
import React from "react";

export default function OrderTakeNote() {
  const { locale } = useI18n();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group mb-5 mt-5 sm:mt-0 flex w-fit items-center gap-10 justify-between rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left transition-all duration-200 hover:border-amber-300 hover:bg-amber-100/80 hover:shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-full bg-amber-100 p-1 text-amber-700 group-hover:bg-amber-200">
              <Info className="h-4 w-4 shrink-0" />
            </div>
            <span className="text-xs font-medium text-amber-900">
              {locale === "vi"
                ? "Lưu ý quan trọng về hình thức đặt hàng (Bánh có sẵn / Đặt trước)"
                : "Important note about order types (Available / Pre-order)"}
            </span>
          </div>
          <span className="text-xs font-semibold text-amber-700 underline decoration-amber-400 underline-offset-2 group-hover:text-amber-900">
            {locale === "vi" ? "Xem chi tiết" : "Details"}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md overflow-hidden rounded-3xl border-0 p-0 shadow-2xl">
        {/* Header với Accent Line & Icon Nổi Bật */}
        <div className="bg-primary/10 px-6 pt-6 pb-4 border-b border-primary/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-primary">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                <Info className="h-4 w-4" />
              </div>
              {locale === "vi"
                ? "Lưu ý quan trọng khi đặt hàng"
                : "Important Order Guidelines"}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Body Content */}
        <div className="space-y-3.5 p-6 text-sm leading-relaxed text-charcoal/80">
          {/* Intro ngắn gọn */}
          <p className="text-xs font-medium text-charcoal/60">
            {locale === "vi"
              ? "Đơn hàng của bạn có thể bao gồm bánh có sẵn hoặc bánh đặt trước:"
              : "Your order may contain items available now or requiring pre-order:"}
          </p>

          {/* Card 1: Cảnh báo Pre-order (Nổi bật chính) */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-all">
            <div className="absolute top-0 left-0 h-full w-1.5 bg-primary" />
            <p className="flex items-center gap-1.5 font-bold text-primary">
              <span>⚠️</span>
              {locale === "vi"
                ? "Đơn hàng có sản phẩm Đặt Trước"
                : "If your cart has Pre-order items"}
            </p>

            <p className="mt-1.5 text-xs text-charcoal/85 leading-relaxed">
              {locale === "vi" ? (
                <>
                  Chỉ cần{" "}
                  <strong className="font-bold text-primary">
                    1 sản phẩm chưa có sẵn
                  </strong>
                  , toàn bộ đơn hàng sẽ chuyển sang hình thức{" "}
                  <span className="rounded bg-primary/15 px-1 py-0.5 font-semibold text-primary">
                    Đặt trước
                  </span>{" "}
                  và giao cùng một ngày.
                </>
              ) : (
                <>
                  If even{" "}
                  <strong className="font-bold text-primary">
                    1 item is pre-order
                  </strong>
                  , the entire order will be processed as{" "}
                  <span className="rounded bg-primary/15 px-1 py-0.5 font-semibold text-primary">
                    Pre-order
                  </span>{" "}
                  for the same date.
                </>
              )}
            </p>
          </div>

          {/* Card 2: Tip mua Bánh Có Sẵn (Gợi ý bán hàng/UX Tip) */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/60 p-4">
            <p className="flex items-center gap-1.5 font-bold text-emerald-800">
              <span>💡</span>
              {locale === "vi"
                ? "Mẹo nhận bánh Có Sẵn ngay hôm nay"
                : "Want your available cakes faster?"}
            </p>

            <p className="mt-1.5 text-xs text-emerald-900/80 leading-relaxed">
              {locale === "vi" ? (
                <>
                  Vui lòng{" "}
                  <strong className="font-semibold text-emerald-950">
                    tách riêng
                  </strong>{" "}
                  các bánh{" "}
                  <span className="rounded bg-emerald-200/60 px-1 py-0.5 font-semibold text-emerald-900">
                    Có sẵn
                  </span>{" "}
                  vào một giỏ hàng độc lập để được giao sớm nhất!
                </>
              ) : (
                <>
                  Please{" "}
                  <strong className="font-semibold text-emerald-950">
                    place separate orders
                  </strong>{" "}
                  for{" "}
                  <span className="rounded bg-emerald-200/60 px-1 py-0.5 font-semibold text-emerald-900">
                    Available
                  </span>{" "}
                  products to get immediate delivery!
                </>
              )}
            </p>
          </div>

          {/* Footer micro-copy */}
          <p className="pt-1 text-center text-[11px] font-medium text-charcoal/40 italic">
            {locale === "vi"
              ? "✨ Artle Bakeshop luôn chuẩn bị bánh tươi mới nhất cho bạn."
              : "✨ Artle Bakeshop ensures fresh quality for every order."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
