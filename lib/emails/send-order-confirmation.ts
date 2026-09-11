import type { OrderConfirmationEmailProps } from "../../types/form-type";
import { OrderConfirmationEmail } from "./templates/order-confirmation";
import { transporter } from "../nodemailer";
import { render } from "react-email";

// RESEND SERVICE
// export async function sendOrderConfirmationEmail(
//   data: OrderConfirmationEmailProps,
// ) {
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
  console.log("[Email] Starting email job...");
  console.log("[Email] To:", data.email);
  const html = await render(OrderConfirmationEmail(data));

  await transporter.verify();

  console.log("[Email] SMTP connection OK");

  const result = await transporter.sendMail({
    from: `"Artle Bakeshop" <${process.env.NODEMAILER_USER}>`,
    to: data.email,
    subject: `Order #${data.orderCode} confirmed 🎉`,
    html,
  });

  console.log("[Email] Email sent:", result.messageId);

  return result;
}
