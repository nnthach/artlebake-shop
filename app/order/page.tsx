"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShoppingBag } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import CustomerOrderInfo from "@/app/order/components/CustomerOrderInfo";
import OrderSummary from "@/app/order/components/OrderSummary";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/context/I18nContext";
import {
  createShippingSchema,
  ShippingFormData,
} from "@/lib/validations/order";
import { useState } from "react";
import DeliveryAddress from "./components/DeliveryAddress";
import FulfillmentMethod from "./components/FulfillmentMethod";
import OrderTypeSelect from "./components/OrderTypeSelect";
import StoreAddress from "./components/StoreAddress";
import PreorderDateSelector from "./components/PreorderDateSelector";
import OrderTakeNote from "./components/OrderTakeNote";
import toast from "react-hot-toast";

const SHIPPING_FEE = 0;
const FREE_SHIPPING_THRESHOLD = 300000;

export default function OrderPage() {
  const { t, locale } = useI18n();
  const { items, totalPrice, cartType } = useCart();

  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "delivery" | "pickup"
  >("delivery");
  const [orderType, setOrderType] = useState<"available" | "preorder">(
    "available",
  );
  const [preorderDate, setPreorderDate] = useState("");

  const shippingSchema = createShippingSchema(t, fulfillmentMethod);

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

    preorder_date_id: selectedOrderType === "preorder" ? preorderDate : null,

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
    // Preorder bắt buộc phải chọn ngày nhận
    if (selectedOrderType === "preorder" && !preorderDate) {
      toast.error(
        locale === "vi"
          ? "Vui lòng chọn ngày nhận bánh."
          : "Please select a pickup date.",
      );
      return;
    }
    const paymentPayload = {
      ...createOrderPayload(data),
      payment_method: "payos",
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
          <>
            {/* ALERT BANNER TRÊN CÙNG */}
            <OrderTakeNote />

            {/*order form */}
            <form
              onSubmit={(e) => e.preventDefault()}
              noValidate
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-5">
                {/* RIGHT: order summary */}
                <div className="order-1 lg:order-2 lg:col-span-2">
                  <OrderSummary
                    shippingFee={shippingFee}
                    grandTotal={grandTotal}
                  />
                </div>

                {/* LEFT: shipping form */}
                <div className="order-2 custom-scrollbar rounded-2xl border border-charcoal/10 bg-white p-4 py-6 shadow-sm lg:order-1 lg:col-span-3 lg:overflow-y-auto">
                  <div className="space-y-8">
                    <CustomerOrderInfo
                      register={register}
                      setValue={setValue}
                      errors={errors}
                      isSubmitting={isSubmitting}
                    />

                    <FulfillmentMethod
                      fulfillmentMethod={fulfillmentMethod}
                      onChange={(method) => {
                        setFulfillmentMethod(method);

                        if (method === "pickup") {
                          setValue("city", "");
                          setValue("district", "");
                          setValue("ward", "");
                          setValue("address", "");
                        }
                      }}
                      isSubmitting={isSubmitting}
                    />

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
                      <OrderTypeSelect
                        orderType={orderType}
                        onChange={(type) => {
                          setOrderType(type);

                          if (type === "available") {
                            setPreorderDate("");
                          }
                        }}
                        isSubmitting={isSubmitting}
                      />
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
                    <section className="p-0">
                      <Button
                        type="button"
                        variant="default"
                        size="lg"
                        disabled={isSubmitting || items.length === 0}
                        className="w-full text-sm font-semibold sm:text-sm lg:text-base"
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
                </div>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
