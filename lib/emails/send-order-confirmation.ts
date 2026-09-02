import { createElement } from "react";
import { resend } from "../resend";
import type { OrderConfirmationEmailProps } from "@/types/form-type";
import { OrderConfirmationEmail } from "./templates/order-confirmation";

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmailProps,
) {
  console.log("data send email", data);
  const { data: result, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: [data.email],
    subject: `Order #${data.orderCode} confirmed 🎉`,
    react: createElement(OrderConfirmationEmail, data),
  });

  if (error) {
    throw error;
  }

  return result;
}
