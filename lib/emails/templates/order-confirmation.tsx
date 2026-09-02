import { OrderConfirmationEmailProps } from "@/types/form-type";
import {
  Body,
  Container,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
  Head,
} from "react-email";

export function OrderConfirmationEmail({
  name,
  orderCode,
  orderType,
  preorderDate,
  items,
  subtotal,
  shippingFee,
  total,
  fulfillmentMethod,
  address,
  city,
  district,
  ward,
}: OrderConfirmationEmailProps) {
  const deliveryAddress = [address, ward, district, city]
    .filter(Boolean)
    .join(", ");

  return (
    <Html>
      <Head />

      <Preview>Your Artlebake order #{orderCode} has been confirmed</Preview>

      <Tailwind>
        <Body className="m-0 bg-[#f7f4ef] py-10 font-sans">
          <Container className="mx-auto max-w-[600px] bg-white px-10 py-10">
            {/* Logo / Brand */}
            <Section className="text-center">
              <Heading className="m-0 text-[24px] font-bold tracking-[4px]">
                ARTLEBAKE
              </Heading>

              <Text className="mt-2 text-[13px] text-[#777777]">
                Freshly baked with love ♡
              </Text>
            </Section>

            <Hr className="my-6 border-[#eeeeee]" />

            {/* Greeting */}
            <Section>
              <Heading className="mb-5 mt-8 text-[28px] font-bold">
                Order Confirmed 🎉
              </Heading>

              <Text className="text-[15px] leading-6 text-[#444444]">
                Hi {name},
              </Text>

              <Text className="text-[15px] leading-6 text-[#444444]">
                Thank you for your order! Your order has been successfully
                confirmed.
              </Text>

              <Text className="mt-6 text-[15px] font-semibold">
                Order #{orderCode}
              </Text>
            </Section>

            {/* Preorder */}
            {orderType === "preorder" && preorderDate && (
              <Section className="my-6 rounded-lg bg-[#f7f4ef] px-5 py-4">
                <Text className="m-0 text-[14px] font-semibold">
                  📅 Preorder Date
                </Text>

                <Text className="m-0 mt-2 text-[14px] leading-[22px] text-[#222222]">
                  {preorderDate}
                </Text>
              </Section>
            )}

            {/* Order Items */}
            <Section>
              <Heading className="mb-4 mt-6 text-[18px] font-bold">
                Order Details
              </Heading>

              {items.map((item, index) => (
                <Section key={`${item.product_name}-${index}`} className="py-2.5">
                  <table width="100%" cellPadding="0" cellSpacing="0">
                    <tbody>
                      <tr>
                        {item.products?.image_url?.[0] && (
                          <td width="64" className="pr-3 align-middle">
                            <Img
                              src={item.products.image_url[0]}
                              alt={item.product_name}
                              width="56"
                              height="56"
                              className="rounded-lg object-cover"
                            />
                          </td>
                        )}

                        <td className="align-middle">
                          <Text className="m-0 text-[14px] font-semibold">
                            {item.product_name}
                          </Text>

                          <Text className="m-0 mt-1 text-[13px] text-[#777777]">
                            {item.quantity} ×{" "}
                            {item.unit_price.toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                          </Text>
                        </td>

                        <td
                          align="right"
                          className="align-middle text-[14px] font-semibold"
                        >
                          {item.subtotal.toLocaleString("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Section>
              ))}
            </Section>

            <Hr className="my-6 border-[#eeeeee]" />

            {/* Summary */}
            <Section>
              <table width="100%" cellPadding="0" cellSpacing="0">
                <tbody>
                  <tr>
                    <td>
                      <Text className="my-1.5 text-[14px] text-[#666666]">
                        Subtotal
                      </Text>
                    </td>

                    <td align="right">
                      <Text className="my-1.5 text-[14px]">
                        {subtotal.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </Text>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <Text className="my-1.5 text-[14px] text-[#666666]">
                        Shipping fee
                      </Text>
                    </td>

                    <td align="right">
                      <Text className="my-1.5 text-[14px]">
                        {shippingFee === 0
                          ? "-"
                          : shippingFee.toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                      </Text>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <Text className="mb-1.5 mt-3 text-[16px] font-bold">
                        Total
                      </Text>
                    </td>

                    <td align="right">
                      <Text className="mb-1.5 mt-3 text-[18px] font-bold">
                        {total.toLocaleString("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        })}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Hr className="my-6 border-[#eeeeee]" />

            {/* Fulfillment */}
            <Section>
              <Heading className="mb-4 mt-6 text-[18px] font-bold">
                {fulfillmentMethod === "delivery"
                  ? "Delivery Information"
                  : "Pickup Information"}
              </Heading>

              <Text className="mb-1 mt-3 text-[13px] text-[#777777]">
                Method
              </Text>

              <Text className="m-0 text-[14px] leading-[22px] text-[#222222]">
                {fulfillmentMethod === "delivery" ? "Delivery" : "Pickup"}
              </Text>

              {fulfillmentMethod === "delivery" && deliveryAddress && (
                <>
                  <Text className="mb-1 mt-3 text-[13px] text-[#777777]">
                    Address
                  </Text>

                  <Text className="m-0 text-[14px] leading-[22px] text-[#222222]">
                    {deliveryAddress}
                  </Text>
                </>
              )}
            </Section>

            <Hr className="my-6 border-[#eeeeee]" />

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-[13px] leading-5 text-[#666666]">
                Thank you for choosing Artlebake ❤️
              </Text>

              <Text className="text-[13px] leading-5 text-[#666666]">
                We hope you enjoy every bite!
              </Text>

              <Text className="mt-6 text-[12px] text-[#aaaaaa]">
                © {new Date().getFullYear()} Artlebake
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
