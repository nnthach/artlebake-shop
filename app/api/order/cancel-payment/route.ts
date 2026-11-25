import { NextRequest, NextResponse } from "next/server";
import {
  cancelCheckoutPayment,
  getFastApiCheckoutErrorStatus,
  isFastApiCheckoutEnabled,
} from "@/lib/fastapi/checkout";
import { FastApiHttpError } from "@/lib/fastapi/http-client";

export async function POST(req: NextRequest) {
  try {
    const { orderCode } = await req.json();

    if (!orderCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Order code is required",
        },
        { status: 400 },
      );
    }

    if (isFastApiCheckoutEnabled()) {
      if (typeof orderCode !== "string" && typeof orderCode !== "number") {
        return NextResponse.json(
          { success: false, error: "Order code is required" },
          { status: 400 },
        );
      }

      try {
        const result = await cancelCheckoutPayment(String(orderCode));
        return NextResponse.json(
          {
            success: true,
            message:
              result.status === "paid"
                ? "Order has already been paid"
                : "Order cancelled",
          },
          { status: 200 },
        );
      } catch (error) {
        if (!(error instanceof FastApiHttpError)) {
          console.warn("FastAPI payment cancellation failed");
        }
        const status = getFastApiCheckoutErrorStatus(error);
        return NextResponse.json(
          {
            success: false,
            error: status === 404 ? "Order not found" : "Failed to cancel order",
          },
          { status },
        );
      }
    }

    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, order_code, status, payment_status")
      .eq("order_code", String(orderCode))
      .maybeSingle();

    if (orderError) throw orderError;

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 },
      );
    }

    // Đã thanh toán thì không được cancel
    if (order.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Order has already been paid",
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: "failed",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("payment_status", "unpaid");

    if (updateError) throw updateError;

    await supabaseAdmin
      .from("payments")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order.id)
      .neq("status", "paid");

    return NextResponse.json({
      success: true,
      message: "Order cancelled",
    });
  } catch (error) {
    console.error("Cancel payment error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
