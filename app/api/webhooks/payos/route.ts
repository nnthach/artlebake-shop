import { NextRequest, NextResponse } from "next/server";

import { payosConfig } from "@/lib/payos";
import { PayOSWebhookBody } from "@/types";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteCacheByResource } from "@/lib/redis-cache";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PayOSWebhookBody;

    // 1. Verify PayOS webhook
    const webhookData = await payosConfig.webhooks.verify(body);

    const { code, orderCode, reference } = webhookData;

    // 2. Find order
    const { data: order, error: orderFetchError } = await supabaseAdmin
      .from("orders")
      .select("id")
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
