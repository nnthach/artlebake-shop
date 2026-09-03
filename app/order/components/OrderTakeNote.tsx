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
          className="mb-5 mt-5 sm:mt-0 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-bold underline underline-offset-2">
            {locale === "vi"
              ? "Lưu ý quan trọng về hình thức đặt hàng"
              : "Important note about order types"}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl border border-amber-100 bg-white p-0 shadow-xl">
        {/* Header: Thiết kế sạch sẽ, trang nhã */}
        <div className="bg-amber-50/50 px-6 pt-6 pb-4 border-b border-amber-100/60">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold text-charcoal sm:text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <Info className="h-4 w-4" />
              </div>
              {locale === "vi"
                ? "Lưu ý khi đặt bánh"
                : "Important Order Information"}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Body Content */}
        <div className="space-y-4 p-6 text-xs text-charcoal/80 sm:text-sm">
          {/* Phần 1: Lịch đặt bánh */}
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs">
              1
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-charcoal">
                  {locale === "vi" ? "Bánh Đặt Trước" : "Pre-order Items"}
                </h4>
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  {locale === "vi" ? "Lịch trình" : "Schedule"}
                </span>
              </div>
              <p className="leading-relaxed text-charcoal/70">
                {locale === "vi" ? (
                  <>
                    Nhận đặt hàng trong tuần từ{" "}
                    <strong className="font-semibold text-charcoal">
                      Thứ 2 đến Thứ 4
                    </strong>
                    , trả hàng vào{" "}
                    <strong className="font-semibold text-charcoal">
                      Thứ 6, Thứ 7 & Chủ Nhật
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Accepted{" "}
                    <strong className="font-semibold text-charcoal">
                      Mon – Wed
                    </strong>
                    , delivered/picked up on{" "}
                    <strong className="font-semibold text-charcoal">
                      Fri, Sat & Sun
                    </strong>
                    .
                  </>
                )}
              </p>
            </div>
          </div>

          <hr className="border-dashed border-charcoal/10" />

          {/* Phần 2: Đơn hàng kết hợp */}
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs">
              2
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-charcoal">
                {locale === "vi" ? "Giỏ hàng kết hợp" : "Combined Orders"}
              </h4>
              <p className="leading-relaxed text-charcoal/70">
                {locale === "vi" ? (
                  <>
                    Nếu giỏ có{" "}
                    <strong className="font-semibold text-amber-900">
                      ít nhất 1 món Đặt Trước (Pre-order)
                    </strong>
                    , toàn bộ đơn hàng sẽ giao cùng ngày theo lịch Đặt Trước.
                  </>
                ) : (
                  <>
                    If your cart has{" "}
                    <strong className="font-semibold text-amber-900">
                      at least 1 Pre-order item
                    </strong>
                    , all items will be fulfilled together on the Pre-order
                    date.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Phần 3: Tip tách đơn (Dạng Callout nhẹ nhàng) */}
          <div className="mt-2 rounded-2xl bg-amber-50/60 p-3.5 border border-amber-200/50">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-950">
              <span className="text-base leading-none">💡</span>
              <span>
                {locale === "vi" ? (
                  <>
                    <strong className="font-semibold">Mẹo nhỏ:</strong> Để nhận
                    bánh{" "}
                    <span className="underline decoration-amber-400 underline-offset-2">
                      Có Sẵn
                    </span>{" "}
                    ngay hôm nay, vui lòng{" "}
                    <strong className="font-semibold">tách riêng</strong> thành
                    đơn hàng khác.
                  </>
                ) : (
                  <>
                    <strong className="font-semibold">Tip:</strong> Want{" "}
                    <span className="underline decoration-amber-400 underline-offset-2">
                      Available
                    </span>{" "}
                    items today? Please{" "}
                    <strong className="font-semibold">
                      place a separate order
                    </strong>
                    .
                  </>
                )}
              </span>
            </p>
          </div>

          {/* Footer Brand note */}
          <div className="pt-2 text-center text-[11px] text-charcoal/40">
            <p className="font-medium text-charcoal/60">Artle Bakeshop</p>
            <p className="italic">
              {locale === "vi"
                ? "Bánh tươi mới được chuẩn bị riêng cho từng đơn hàng."
                : "Freshly baked with care for every single order."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
