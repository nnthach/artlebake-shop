"use client";

import {
  Check,
  CreditCard,
  Eye,
  Package,
  Store,
  Tag,
  Truck,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  formatOrderPaymentStatus,
  formatOrderPaymentStatusColor,
  formatOrderStatus,
  formatOrderStatusColor,
  formatOrderTypeColor,
} from "@/utils/format-status";
import { useI18n } from "@/context/I18nContext";
import { formatDateReverse, formatDateTime } from "@/utils/format-date";
import { OrderEnum } from "@/enums/order-status.enum";
import toast from "react-hot-toast";

interface ProductTranslation {
  locale: string;
  name: string;
}

interface ProductDetail {
  id: string;
  image_url: string[] | null;
  is_active: boolean;
  product_translations: ProductTranslation[];
}

interface OrderItemDetail {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
  products: ProductDetail | null;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  transaction_id: string | null;
}

interface PreorderSchedule {
  id: string;
  date: string;
  status: boolean;
}

interface OrderDetail {
  id: string;
  order_code: string;

  // Order
  status: string;
  payment_status: string;
  order_type: string;
  fulfillment_method: string;
  preorder_date_id: string | null;

  // Customer
  name: string;
  phone: string;
  email: string | null;

  // Shipping
  address: string | null;
  city: string | null;
  district: string | null;
  ward: string | null;
  note: string | null;

  // Total
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: string | null;

  // Timestamps
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  order_items: OrderItemDetail[];
  payments: Payment | null;
  preorder_schedule: PreorderSchedule | null;
}

const formatPrice = (price: number) =>
  `${(price ?? 0).toLocaleString("vi-VN")} đ`;

const getProductName = (item: OrderItemDetail, locale: string) =>
  item.products?.product_translations.find(
    (translation) => translation.locale === locale,
  )?.name ??
  item.products?.product_translations[0]?.name ??
  item.product_name;

const getProductImage = (item: OrderItemDetail) =>
  item.products?.image_url?.[0] ?? null;

interface OrderDetailSheetProps {
  orderId: string;
  onUpdated?: () => void;
}

export default function OrderDetailSheet({
  orderId,
  onUpdated,
}: OrderDetailSheetProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/admin/orders/${orderId}?locale=${locale}`,
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch order detail");
        }

        setOrder(data.data);
      } catch (fetchError) {
        console.error("Fetch admin order detail error:", fetchError);
        setError(t("admin.orderDetailSheet.state.error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [open, orderId, locale, t]);

  const handleDelivered = async (orderId: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}/delivered`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update order status");
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: OrderEnum.Delivered,
              delivered_at: data.data.delivered_at,
            }
          : prev,
      );

      onUpdated?.();

      toast.success(
        locale === "vi"
          ? "Cập nhật trạng thái đơn hàng thành công"
          : "Order status updated successfully",
      );
    } catch (error) {
      console.error("Update order delivered error:", error);
      setError(t("admin.orderDetailSheet.state.error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelled = async (orderId: string) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}/cancelled`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update order status");
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: OrderEnum.Cancelled,
              cancelled_at: data.data.cancelled_at,
            }
          : prev,
      );
      toast.success(
        locale === "vi"
          ? "Cập nhật trạng thái đơn hàng thành công"
          : "Order status updated successfully",
      );
      onUpdated?.();
    } catch (error) {
      console.error("Update order cancelled error:", error);
      setError(t("admin.orderDetailSheet.state.error"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Xem chi tiết"
          className="h-8 w-8 text-blue-600 hover:bg-blue-500/10 hover:text-blue-600"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </SheetTrigger>

      <SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-[550px] bg-white">
        <SheetHeader className="border-b bg-[#FAFAFA] p-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <SheetTitle className="flex items-center gap-2 text-lg">
              {t("admin.orderDetailSheet.header.title").replace(
                "{orderCode}",
                order?.order_code || "-",
              )}
            </SheetTitle>
            {order && (
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold shadow-sm ${formatOrderStatusColor(order.status)}`}
              >
                {t(
                  `admin.orderPage.status.order.${formatOrderStatus(order.status)}`,
                )}
              </span>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            {t("admin.orderDetailSheet.state.loading")}
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-red-600">
            {error}
          </div>
        ) : order ? (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto p-6 pt-2">
              {/** Customer Information Section */}
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <User size={16} />{" "}
                  {t("admin.orderDetailSheet.customer.title")}
                </h3>
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-grey-100 bg-[#FAFAFA] p-4">
                  <div className="space-y-1 text-sm">
                    <p className="text-sm text-grey-100">
                      {t("admin.orderDetailSheet.customer.name")}
                    </p>
                    <p className="font-semibold">{order.name}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-sm text-grey-100">
                      {t("admin.orderDetailSheet.customer.phone")}
                    </p>
                    <p className="font-semibold">{order.phone}</p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-sm text-grey-100">
                      {t("admin.orderDetailSheet.customer.email")}
                    </p>
                    <p className="font-semibold">{order.email}</p>
                  </div>

                  {order.note && (
                    <div className="col-span-2 space-y-1 text-sm">
                      <p className="text-sm text-grey-100">
                        {t("admin.orderDetailSheet.customer.note")}
                      </p>
                      <p className="font-semibold">{order.note}</p>
                    </div>
                  )}
                </div>
              </section>

              {/** Item List Section */}
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <Package size={16} />{" "}
                  {t("admin.orderDetailSheet.items.title").replace(
                    "{count}",
                    String(order.order_items?.length || 0),
                  )}
                </h3>
                <div className="space-y-3">
                  {order.order_items?.map((item) =>
                    (() => {
                      const productName = getProductName(item, locale);
                      const productImage = getProductImage(item);

                      return (
                        <div
                          key={item.id}
                          className="flex gap-4 rounded-xl border p-3 transition-colors hover:bg-[#FAFAFA]"
                        >
                          <div className="relative flex aspect-square w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
                            {productImage ? (
                              <Image
                                src={productImage}
                                alt={productName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Package size={24} className="text-grey-300" />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <h4 className="truncate font-bold text-grey-800 text-sm">
                              {productName}
                            </h4>
                            <div className="flex items-end justify-between gap-3">
                              <p className="text-sm text-grey-600">
                                {formatPrice(item.unit_price)} × {item.quantity}
                              </p>
                              <p className="text-sm font-bold text-grey-900">
                                {formatPrice(item.subtotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })(),
                  )}
                </div>
              </section>

              {/* Fulfillment Method Section */}
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <Truck size={16} />
                  {t("admin.orderDetailSheet.fulfillment.title")}
                </h3>

                <div className="space-y-3 rounded-xl border border-grey-100 bg-[#FAFAFA] p-4">
                  {/* Order Type & Fulfillment Method Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Order Type */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${formatOrderTypeColor(
                        order.order_type,
                      )}`}
                    >
                      <Tag size={13} />
                      {t(`admin.orderPage.type.${order.order_type}`)}
                    </span>

                    {/* Fulfillment Method */}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-grey-200 bg-white px-2.5 py-1 text-xs font-semibold text-grey-700 shadow-sm">
                      {order.fulfillment_method === "delivery" ? (
                        <Truck size={13} className="text-blue-600" />
                      ) : (
                        <Store size={13} className="text-emerald-600" />
                      )}
                      {t(
                        `admin.orderDetailSheet.fulfillment.${order.fulfillment_method}`,
                      )}
                    </span>
                  </div>
                  {order.order_type !== "available" && (
                    <div className="grid grid-cols-1 gap-4">
                      {/* Preorder Schedule Date (Hiển thị nếu là đơn preorder và có ngày giao/nhận) */}
                      {order.order_type === "preorder" &&
                        order.preorder_schedule?.date && (
                          <div className="space-y-1 text-sm">
                            <p className="text-sm text-grey-100">
                              {t(
                                "admin.orderDetailSheet.fulfillment.preorderDate",
                              )}
                            </p>
                            <p className="font-semibold">
                              {formatDateReverse(order.preorder_schedule.date)}
                            </p>
                          </div>
                        )}

                      {/* Delivery Address (Chỉ hiển thị khi fulfillment_method === 'delivery') */}
                      {order.fulfillment_method === "delivery" && (
                        <div className="space-y-1 text-sm">
                          <p className="text-sm text-grey-100">
                            {t(
                              "admin.orderDetailSheet.fulfillment.addressTitle",
                            )}
                          </p>
                          <p className="font-semibold">
                            {[
                              order.address,
                              order.ward,
                              order.district,
                              order.city,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Payment & Summary Section */}
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <CreditCard size={16} />
                  {t("admin.orderDetailSheet.payment.title")}
                </h3>

                <div className="rounded-xl border border-grey-200/80 bg-[#FAFAFA]/50 p-4 space-y-4">
                  {/* Chi tiết thanh toán & Ngày tạo */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Phương thức & Trạng thái thanh toán */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase text-grey-100">
                        {t("admin.orderDetailSheet.payment.method")}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold uppercase text-grey-900">
                          {order.payment_method}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${formatOrderPaymentStatusColor(
                            order.payment_status,
                          )}`}
                        >
                          {t(
                            `admin.orderPage.status.payment.${formatOrderPaymentStatus(
                              order.payment_status,
                            )}`,
                          )}
                        </span>
                      </div>
                      {order.payments?.transaction_id && (
                        <p className="break-all text-xs text-grey-100">
                          {t("admin.orderDetailSheet.payment.transactionId")}:{" "}
                          <span className="font-mono text-grey-700">
                            {order.payments.transaction_id}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Ngày đặt hàng */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase text-grey-100">
                        {t("admin.orderDetailSheet.date")}
                      </p>
                      <p className="text-sm font-semibold text-grey-900">
                        {formatDateTime(order.created_at).full}
                      </p>
                    </div>
                  </div>

                  {/* Bảng tính tổng tiền */}
                  <div className="space-y-2 border-t border-grey-200/80 pt-3 text-sm">
                    <div className="flex items-center justify-between text-grey-600">
                      <span>
                        {t("admin.orderDetailSheet.summary.subtotal")}
                      </span>
                      <span className="font-medium text-grey-900">
                        {formatPrice(order.subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-grey-600">
                      <span>
                        {t("admin.orderDetailSheet.summary.shippingFee")}
                      </span>
                      <span className="font-medium text-grey-900">
                        {formatPrice(order.shipping_fee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-dashed border-grey-300 pt-2.5">
                      <span className="font-bold text-grey-800">
                        {t("admin.orderDetailSheet.summary.total")}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <SheetFooter className="flex w-full flex-row items-center justify-between border-t px-6 py-4">
              {order.status !== OrderEnum.Cancelled && (
                <Button
                  disabled={isUpdating}
                  onClick={() => handleCancelled(order.id)}
                  type="button"
                  variant="outline"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  {t("admin.orderDetailSheet.footer.cancel")}
                </Button>
              )}

              {order.status !== OrderEnum.Delivered && (
                <Button
                  disabled={isUpdating}
                  onClick={() => handleDelivered(order.id)}
                  type="button"
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  {t("admin.orderDetailSheet.footer.delivered")}
                </Button>
              )}
            </SheetFooter>
          </>
        ) : (
          <div className="p-6 text-sm text-muted-foreground">
            {t("admin.orderDetailSheet.state.empty")}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
