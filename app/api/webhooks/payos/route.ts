import { NextRequest, NextResponse } from "next/server";

import { payosConfig } from "@/lib/payos";
import { PayOSWebhookBody } from "@/types";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteCacheByResource } from "@/lib/redis-cache";
import { sendOrderConfirmationEmail } from "@/lib/emails/send-order-confirmation";
type OrderItemRow = {
  product_name: string;
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
  products: {
    image_url?: string[];
  } | null;
};
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PayOSWebhookBody;

    // 1. Verify PayOS webhook
    const webhookData = await payosConfig.webhooks.verify(body);

    const { code, orderCode, reference } = webhookData;

    // 2. Find order
    // 2. Find order
    const { data: order, error: orderFetchError } = await supabaseAdmin
      .from("orders")
      .select(
        `
          *,
          order_items (
            product_name,
            quantity,
            unit_price,
            subtotal,
            products (
              image_url
            )
          ),
          preorder_schedules (
            date
          )
        `,
      )
      .eq("order_code", String(orderCode))
      .maybeSingle();

    if (orderFetchError) {
      throw orderFetchError;
    }

    // 3. Order does not exist
    if (!order) {
      return NextResponse.json({
        error: 0,
        message: "OK",
      });
    }

    // 4. Payment failed
    if (code !== "00") {
      const businessDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date());

      const { data: result, error: cancelError } = await supabaseAdmin.rpc(
        "cancel_order_and_release_stock",
        {
          p_order_id: order.id,
          p_business_date: businessDate,
          p_reason: "Payment failed",
          p_gateway_response: webhookData,
        },
      );

      if (cancelError) {
        throw cancelError;
      }

      if (result?.already_paid) {
        return NextResponse.json({
          error: 0,
          message: "Order already paid",
        });
      }

      if (result?.already_cancelled) {
        return NextResponse.json({
          error: 0,
          message: "Already cancelled",
        });
      }

      void deleteCacheByResource("products");

      return NextResponse.json({
        error: 0,
        message: "Payment failed and stock released",
      });
    }

    // 5. Payment success
    // 5.1 Process payment + inventory
    // inside PostgreSQL transaction
    const { data: result, error: processError } = await supabaseAdmin.rpc(
      "confirm_successful_payment",
      {
        p_order_id: order.id,
        p_reference: reference,
        p_gateway_response: webhookData,
      },
    );

    if (processError) {
      throw processError;
    }

    if (result?.order_cancelled) {
      console.error(
        `Order ${order.id} was cancelled before payment confirmation.`,
      );

      return NextResponse.json({
        error: 0,
        message: "Order already cancelled",
      });
    }

    if (!result?.success) {
      throw new Error("Failed to process successful payment");
    }

    // 5.2 Webhook duplicated
    if (result.already_processed) {
      return NextResponse.json({
        error: 0,
        message: "Already processed",
      });
    }

    // 5.3 Clear product cache
    void deleteCacheByResource("products");

    // 6. Send order confirmation email
    if (order.email) {
      try {
        await sendOrderConfirmationEmail({
          name: order.name,
          email: order.email,
          phone: order.phone,

          orderCode: order.order_code,
          orderType: order.order_type,

          preorderDate: order.preorder_schedules?.date,

          items: order.order_items.map((item: OrderItemRow) => ({
            product_name: item.product_name,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            subtotal: Number(item.subtotal),
            products: {
              image_url: item.products?.image_url ?? [],
            },
          })),

          subtotal: Number(order.subtotal),
          shippingFee: Number(order.shipping_fee),
          total: Number(order.total),

          fulfillmentMethod: order.fulfillment_method,

          address: order.address,
          city: order.city,
          district: order.district,
          ward: order.ward,
        });
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
      }
    }

    // 6. PayOS requires HTTP 200
    return NextResponse.json({
      error: 0,
      message: "success",
    });
  } catch (error) {
    console.error("PayOS webhook error:", error);

    return NextResponse.json(
      {
        error: -1,
        message: "Webhook processing failed",
      },
      { status: 400 },
    );
  }
}
