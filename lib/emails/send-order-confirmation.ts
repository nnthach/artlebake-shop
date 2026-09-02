import type { OrderConfirmationEmailProps } from "@/types/form-type";
import { OrderConfirmationEmail } from "./templates/order-confirmation";
import { transporter } from "../nodemailer";
import { render } from "react-email";

// RESEND SERVICE
// export async function sendOrderConfirmationEmail(
//   data: OrderConfirmationEmailProps,
// ) {
//   console.log("data send email", data);
//   const { data: result, error } = await resend.emails.send({
//     from: process.env.RESEND_FROM_EMAIL!,
//     to: [data.email],
//     subject: `Order #${data.orderCode} confirmed 🎉`,
//     react: createElement(OrderConfirmationEmail, data),
//   });

//   if (error) {
//     throw error;
//   }

//   return result;
// }

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmailProps,
) {
  const html = await render(OrderConfirmationEmail(data));

  const result = await transporter.sendMail({
    from: `"Artle Bakeshop" <${process.env.NODEMAILER_USER}>`,
    to: data.email,
    subject: `Order #${data.orderCode} confirmed 🎉`,
    html,
  });

  return result;
}
