import type { OrderConfirmationEmailProps } from "../../types/form-type";
import { OrderConfirmationEmail } from "./templates/order-confirmation";
import { render } from "react-email";
import sgMail from "../sendgrid";

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmailProps,
) {
  const html = await render(OrderConfirmationEmail(data));
  console.log("start send email");
  console.log("[Debug] API Key set:", !!process.env.SENDGRID_API_KEY);
  console.log("[Debug] From email:", process.env.SENDGRID_FROM_EMAIL);

  try {
    const result = await sgMail.send({
      from: `"Artle Bakeshop" <${process.env.SENDGRID_FROM_EMAIL}>`,
      to: data.email,
      subject: `Order #${data.orderCode} confirmed 🎉`,
      html,
    });

    console.log("[Email] Status code:", result[0].statusCode);
    console.log("[Email] Headers:", JSON.stringify(result[0].headers));

    return result;
  } catch (error) {
    console.error("[Email] SendGrid error:", error);
    throw error;
  }
}
