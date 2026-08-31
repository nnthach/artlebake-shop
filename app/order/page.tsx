"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  MapPin,
  ShoppingBag,
  Store,
  PackageCheck,
  CalendarClock,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import CustomerOrderInfo from "@/components/sections/order/CustomerOrderInfo";
import OrderSummary from "@/components/sections/order/OrderSummary";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/context/I18nContext";
import {
  createShippingSchema,
  ShippingFormData,
} from "@/lib/validations/order";
import { useState } from "react";
import { cn } from "@/lib/utils";
import DeliveryAddress from "./components/DeliveryAddress";
import StoreAddress from "./components/StoreAddress";
import PreorderDateSelector from "./components/PreorderDateSelector";

const SHIPPING_FEE = 0;
const FREE_SHIPPING_THRESHOLD = 300000;

export default function OrderPage() {
  const { t, locale } = useI18n();
  const { items, totalPrice, cartType } = useCart();

  console.log("item", items);

  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "delivery" | "pickup"
  >("delivery");
  const [orderType, setOrderType] = useState<"available" | "preorder">(
    "available",
  );
  const [preorderDate, setPreorderDate] = useState("");

  const shippingSchema = createShippingSchema(t);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "",
      district: "",
      ward: "",
      address: "",
      note: "",
      paymentMethod: "",
    },
  });

  const shippingFee =
    totalPrice === 0 || totalPrice >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FEE;
  const grandTotal = totalPrice + shippingFee;

  // order type
  const selectedOrderType = cartType === "select" ? orderType : cartType;

  // payload
  const createOrderPayload = (data: ShippingFormData) => ({
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    note: data.note,
    city: data.city,
    district: data.district,
    ward: data.ward,
    subtotal: totalPrice,
    shipping_fee: shippingFee,
    total: grandTotal,

    preorder_date: selectedOrderType === "preorder" ? preorderDate : null,

    order_type: selectedOrderType,
    fulfillment_method: fulfillmentMethod,

    items: items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      unit_price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    })),
  });

  // payos submit
  const onSubmit = async (data: ShippingFormData) => {
    const paymentPayload = {
      ...createOrderPayload(data),
      paymentMethod: "payos",
    };
    console.log("paymentPayload", paymentPayload);
    // try {
    //   const res = await fetch("/api/order", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       ...createOrderPayload(data),
    //       paymentMethod: "payos",
    //     }),
    //   });

    //   const resData = await res.json();

    //   if (!res.ok) {
    //     throw new Error(resData.error);
    //   }

    //   window.location.href = resData.data.payment_link;
    // } catch (error) {
    //   console.error(error);
    //   toast.error(t("orderPage.toastError"));
    // }
  };

  return (
    <div className="flex h-screen flex-col bg-sand">
      <Header forceScrolled />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-y-auto px-6 pb-4 pt-20 lg:overflow-hidden lg:pt-24">
        {!items ? (
          <div className="m-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-charcoal/10 bg-white px-8 py-14 text-center shadow-sm">
            <ShoppingBag className="h-10 w-10 text-charcoal/25" />
            <h2 className="text-lg font-semibold text-charcoal">
              {t("orderPage.signInRequired.title")}
            </h2>
            <p className="text-sm text-charcoal/55">
              {t("orderPage.signInRequired.message")}
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => e.preventDefault()}
            noValidate
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-5">
              {/* LEFT: shipping form */}
              <div className="custom-scrollbar space-y-4 lg:col-span-3 lg:overflow-y-auto lg:pr-1">
                <CustomerOrderInfo
                  register={register}
                  setValue={setValue}
                  errors={errors}
                  isSubmitting={isSubmitting}
                />

                {/* Fulfillment method */}
                <section className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal/50">
                    {locale === "vi"
                      ? "Phương thức nhận hàng"
                      : "Fulfillment method"}
                  </h2>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Delivery */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setFulfillmentMethod("delivery")}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                        fulfillmentMethod === "delivery"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-charcoal/10 hover:border-charcoal/20",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          fulfillmentMethod === "delivery"
                            ? "bg-primary text-white"
                            : "bg-charcoal/5 text-charcoal/50",
                        )}
                      >
                        <MapPin className="h-5 w-5" />
                      </div>

                      <p className="font-semibold text-charcoal">
                        {locale === "vi" ? "Giao hàng" : "Delivery"}
                      </p>
                    </button>

                    {/* Pickup */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setFulfillmentMethod("pickup")}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                        fulfillmentMethod === "pickup"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-charcoal/10 hover:border-charcoal/20",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          fulfillmentMethod === "pickup"
                            ? "bg-primary text-white"
                            : "bg-charcoal/5 text-charcoal/50",
                        )}
                      >
                        <Store className="h-5 w-5" />
                      </div>

                      <p className="font-semibold text-charcoal">
                        {locale === "vi" ? "Đến lấy" : "Pickup"}
                      </p>
                    </button>
                  </div>
                </section>

                {fulfillmentMethod === "delivery" ? (
                  <DeliveryAddress
                    register={register}
                    setValue={setValue}
                    errors={errors}
                    isSubmitting={isSubmitting}
                  />
                ) : (
                  <StoreAddress />
                )}

                {/* cart type / order type */}
                {cartType === "select" && (
                  <section className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal/50">
                      {locale === "vi" ? "Hình thức đặt hàng" : "Order type"}
                    </h2>

                    <p className="mt-1 text-xs text-charcoal/50">
                      {locale === "vi"
                        ? "Một số sản phẩm trong giỏ có thể nhận ngay hoặc đặt trước."
                        : "Some products in your cart are available now or can be pre-ordered."}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Available */}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setOrderType("available")}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                          orderType === "available"
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-charcoal/10 hover:border-charcoal/20",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            orderType === "available"
                              ? "bg-primary text-white"
                              : "bg-charcoal/5 text-charcoal/50",
                          )}
                        >
                          <PackageCheck className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-charcoal">
                            {locale === "vi" ? "Có sẵn" : "Available"}
                          </p>

                          <p className="mt-1 text-xs text-charcoal/50">
                            {locale === "vi"
                              ? "Nhận bánh trong ngày"
                              : "Receive available products"}
                          </p>
                        </div>
                      </button>

                      {/* Preorder */}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setOrderType("preorder")}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-4 text-left transition",
                          orderType === "preorder"
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-charcoal/10 hover:border-charcoal/20",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            orderType === "preorder"
                              ? "bg-primary text-white"
                              : "bg-charcoal/5 text-charcoal/50",
                          )}
                        >
                          <CalendarClock className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-charcoal">
                            {locale === "vi" ? "Đặt trước" : "Pre-order"}
                          </p>

                          <p className="mt-1 text-xs text-charcoal/50">
                            {locale === "vi"
                              ? "Chọn ngày nhận bánh"
                              : "Choose your preferred date"}
                          </p>
                        </div>
                      </button>
                    </div>
                  </section>
                )}

                {selectedOrderType === "preorder" && (
                  <PreorderDateSelector
                    productIds={items.map((item) => item.product.id)}
                    value={preorderDate}
                    onChange={setPreorderDate}
                    disabled={isSubmitting}
                  />
                )}

                {/*payment button */}
                <section className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    disabled={isSubmitting || items.length === 0}
                    className="w-full font-semibold"
                    onClick={handleSubmit(onSubmit)}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : locale === "vi" ? (
                      "Thanh toán quét mã QR"
                    ) : (
                      "Pay with QR code"
                    )}
                  </Button>
                </section>
              </div>

              {/* RIGHT: order summary */}
              <OrderSummary shippingFee={shippingFee} grandTotal={grandTotal} />
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
